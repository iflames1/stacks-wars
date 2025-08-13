"use client";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import * as z from "zod";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { apiRequest, ApiRequestProps } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { nanoid } from "nanoid";
import { createSponsoredGamePool } from "@/lib/actions/createGamePool";
import { joinSponsoredGamePool } from "@/lib/actions/joinGamePool";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { useConnectUser } from "@/contexts/ConnectWalletContext";

const formSchema = z.object({
	name: z.string().min(3, {
		message: "Lobby name must be at least 3 characters.",
	}),
	description: z
		.string()
		.min(3, {
			message: "Lobby description must be at least 3 characters.",
		})
		.optional(),
	poolSize: z.number().min(50, {
		message: "Pool size must be at least 50 STX.",
	}),
});

interface FormData {
	name: string;
	description?: string;
	poolSize: number;
}

interface CreateSponsoredLobbyFormProps {
	gameId: string;
}

export default function CreateSponsoredLobbyForm({
	gameId,
}: CreateSponsoredLobbyFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const { isConnecting, isConnected, handleConnect } = useConnectUser();
	const [deployedContract, setDeployedContract] = useState<{
		contractName: string;
		contractAddress: `${string}.${string}`;
		poolSize: number;
		txId: string;
	} | null>(null);
	const [joined, setJoined] = useState<{
		contractAddress: `${string}.${string}`;
		txId: string;
		poolSize: number;
	} | null>(null);
	const prevPoolSizeRef = useRef<number | undefined>(undefined);

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
		},
		mode: "onChange",
	});

	const poolSize = useWatch({
		control: form.control,
		name: "poolSize",
	});

	useEffect(() => {
		const poolSizeChanged =
			prevPoolSizeRef.current !== undefined &&
			poolSize !== prevPoolSizeRef.current;

		if (deployedContract && poolSizeChanged) {
			console.log("⚠️ Pool size changed, resetting deployed contract");
			setDeployedContract(null);
			setJoined(null);
		}

		prevPoolSizeRef.current = poolSize;
	}, [deployedContract, poolSize]);

	const onSubmit = async (values: FormData) => {
		setIsLoading(true);

		try {
			const deployerAddress = await getClaimFromJwt<string>("wallet");
			if (!deployerAddress) {
				toast.error("You need to connect your wallet first.");
				setIsLoading(false);
				return;
			}

			let contractInfo = deployedContract;

			if (!contractInfo) {
				const contractName = `${nanoid(5)}-sponsored-stacks-wars`;
				const contract: `${string}.${string}` = `${deployerAddress}.${contractName}`;

				const deployTx = await createSponsoredGamePool(
					values.poolSize,
					contractName,
					deployerAddress
				);

				if (!deployTx.txid) {
					throw new Error(
						"Failed to deploy sponsored game pool: missing transaction ID"
					);
				}

				try {
					await waitForTxConfirmed(deployTx.txid);
					console.log("✅ Sponsored Deploy Transaction confirmed!");
				} catch (err) {
					console.error("❌ TX failed or aborted:", err);
					throw err;
				}

				contractInfo = {
					contractName,
					contractAddress: contract,
					poolSize: values.poolSize,
					txId: deployTx.txid,
				};
				setDeployedContract(contractInfo);
			}

			let joinInfo = joined;
			let tx_id: string;

			if (
				joinInfo &&
				joinInfo.contractAddress === contractInfo.contractAddress
			) {
				console.log("✅ Using existing sponsored join transaction");
				tx_id = joinInfo.txId;
			} else {
				const joinTx = await joinSponsoredGamePool(
					contractInfo.contractAddress,
					deployerAddress,
					contractInfo.poolSize
				);

				if (!joinTx.txid) {
					throw new Error(
						"Failed to join sponsored game pool: missing transaction ID"
					);
				}

				try {
					await waitForTxConfirmed(joinTx.txid);
					console.log("✅ Sponsored Join Transaction confirmed!");
				} catch (err) {
					console.error("❌ TX failed or aborted:", err);
					throw err;
				}

				joinInfo = {
					contractAddress: contractInfo.contractAddress,
					txId: joinTx.txid,
					poolSize: contractInfo.poolSize,
				};
				setJoined(joinInfo);
				tx_id = joinTx.txid;
			}

			const apiParams: ApiRequestProps = {
				path: "/lobby",
				method: "POST",
				body: {
					name: values.name,
					description: values.description || null,
					entry_amount: 0, // Entry fee is 0 for sponsored lobbies
					current_amount: contractInfo.poolSize, // Pool size is the amount sponsor put in
					contract_address: contractInfo.contractAddress,
					tx_id,
					game_id: gameId,
				},
				tag: "lobby",
				revalidateTag: "lobby",
				revalidatePath: "/lobby",
			};

			const lobbyId = await apiRequest<string>(apiParams);

			setDeployedContract(null);
			setJoined(null);

			toast.info(
				"Please wait while we redirect you to your sponsored lobby"
			);
			router.replace(`/lobby/${lobbyId}`);
		} catch (error) {
			toast.error("Something went wrong", {
				description: "Please try again",
			});
			console.error(
				"An error occurred while creating sponsored lobby:",
				error
			);
		}
		setIsLoading(false);
	};

	return (
		<Card className="bg-primary/30">
			<CardHeader>
				<CardTitle className="text-2xl">
					Create a Sponsored Lobby
				</CardTitle>
				<CardDescription>
					Set up a sponsored lobby where you fund the entire prize
					pool and players join for free
				</CardDescription>
			</CardHeader>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="space-y-4"
				>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="inline-flex items-center gap-1">
										Lobby Name
										<span className="text-destructive">
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter lobby name"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Give your sponsored lobby a descriptive
										name
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description</FormLabel>
									<FormControl>
										<Input
											placeholder="Enter lobby description"
											{...field}
										/>
									</FormControl>
									<FormDescription>
										Provide additional details about your
										sponsored lobby
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="poolSize"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="inline-flex items-center gap-1">
										Pool Size (STX)
										<span className="text-destructive">
											*
										</span>
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											placeholder="Enter pool size in STX"
											value={field.value || ""}
											onChange={(e) => {
												const value = e.target.value;
												field.onChange(
													value === ""
														? undefined
														: parseFloat(value)
												);
											}}
										/>
									</FormControl>
									<FormDescription>
										This is the total prize pool you&apos;ll
										sponsor. Players can join for free.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter className="flex justify-end">
						{!isConnected ? (
							<Button
								onClick={handleConnect}
								type="button"
								disabled={isConnecting}
							>
								{isConnecting && (
									<Loader
										className="h-4 w-4 mr-1 animate-spin"
										size={17}
									/>
								)}
								{isConnecting
									? "Connecting..."
									: "Connect wallet to create sponsored lobby"}
							</Button>
						) : (
							<Button type="submit" disabled={isLoading}>
								{isLoading && (
									<Loader
										className="h-4 w-4 mr-1 animate-spin"
										size={17}
									/>
								)}
								{isLoading
									? "Creating..."
									: deployedContract
										? "Join Deployed Sponsored Lobby"
										: "Create Sponsored Lobby"}
							</Button>
						)}
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
