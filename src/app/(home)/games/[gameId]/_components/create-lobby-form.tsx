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
import { Switch } from "@/components/ui/switch";
import { Loader } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useState } from "react";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { nanoid } from "nanoid";
import { createGamePool } from "@/lib/actions/deploy-game-pool";
import { joinGamePool } from "@/lib/actions/join-game-pool";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { useConnectUser } from "@/hooks/useConnectUser";

const formSchema = z.object({
	name: z.string().min(3, {
		message: "Lobby name must be at least 3 characters.",
	}),
	description: z.string().min(3, {
		message: "Lobby description must be at least 3 characters.",
	}),
	withPool: z.boolean(),
	amount: z
		.number()
		.min(5, {
			message: "Amount must be at least 5 STX.",
		})
		.optional(),
});

interface FormData {
	name: string;
	description: string;
	withPool: boolean;
	amount?: number;
}

interface CreateLobbyFormProps {
	gameId: string;
	gameName: string;
}

export default function CreateLobbyForm({
	gameId,
	gameName,
}: CreateLobbyFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const { isConnecting, isConnected, handleConnect } = useConnectUser();

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			description: "",
			withPool: false,
		},
		mode: "onChange",
	});

	const withPool = form.watch("withPool");

	const onSubmit = async (values: FormData) => {
		setIsLoading(true);

		try {
			let apiParams: ApiRequestProps;

			if (values.withPool) {
				if (!values.amount) {
					throw new Error("Amount is required when using a pool");
				}

				const deployerAddress = await getClaimFromJwt<string>("wallet");
				if (!deployerAddress) {
					toast.error("You need to connect your wallet first.");
					setIsLoading(false);
					return;
				}
				const contractName = `${nanoid(5)}-stacks-wars`;
				const contract: `${string}.${string}` = `${deployerAddress}.${contractName}`;
				const entry_amount = values.amount;

				const deployTx = await createGamePool(
					entry_amount,
					contractName,
					deployerAddress
				);
				if (!deployTx.txid) {
					throw new Error(
						"Failed to deploy game pool: missing transaction ID"
					);
				}
				try {
					await waitForTxConfirmed(deployTx.txid);
					console.log("✅ Deploy Transaction confirmed!");
				} catch (err) {
					console.error("❌ TX failed or aborted:", err);
				}

				const joinTx = await joinGamePool(contract, entry_amount);
				console.log("called join pool");
				if (!joinTx.txid) {
					throw new Error(
						"Failed to join game pool: missing transaction ID"
					);
				}
				try {
					await waitForTxConfirmed(deployTx.txid);
					console.log("✅ Join Transaction confirmed!");
				} catch (err) {
					console.error("❌ TX failed or aborted:", err);
				}

				const tx_id = joinTx.txid;
				const contract_address = contract;
				console.log(entry_amount, contract_address, tx_id);

				apiParams = {
					path: "room",
					method: "POST",
					body: {
						name: values.name,
						description: values.description,
						entry_amount,
						contract_address,
						tx_id,
						game_id: gameId,
						game_name: gameName,
					},
					tag: "lobby",
					revalidateTag: "lobby",
					revalidatePath: "/lobby",
				};
			} else {
				apiParams = {
					path: "room",
					method: "POST",
					body: {
						name: values.name,
						description: values.description,
						game_id: gameId,
						game_name: gameName,
					},
					tag: "lobby",
					revalidateTag: "lobby",
					revalidatePath: "/lobby",
				};
			}
			const lobbyId = await apiRequest<string>(apiParams);
			toast.info("Please wait while we redirect you to your lobby");
			router.replace(`/lobby/${lobbyId}`);
		} catch (error) {
			toast.error("Something went wrong", {
				description: "Please try again later",
			});
			console.error("An error occured while creating lobby:", error);
		}
		setIsLoading(false);
	};

	return (
		<Card className="bg-primary/30">
			<CardHeader>
				<CardTitle className="text-2xl">Create a Lobby</CardTitle>
				<CardDescription>
					Set up a new lobby and invite friends to join
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
										Give your lobby a descriptive name
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
										lobby
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="withPool"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center space-x-2 space-y-0">
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormLabel>
										Create lobby with pool
									</FormLabel>
								</FormItem>
							)}
						/>
						{withPool && (
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel className="inline-flex items-center gap-1">
											Pool Amount (STX)
											<span className="text-destructive">
												*
											</span>
										</FormLabel>
										<FormControl>
											<Input
												type="number"
												placeholder="Enter amount in STX"
												value={field.value || ""}
												onChange={(e) => {
													const value =
														e.target.value;
													field.onChange(
														value === ""
															? undefined
															: parseFloat(value)
													);
												}}
											/>
										</FormControl>
										<FormDescription>
											This is the initial amount
											you&apos;ll contribute to the pool
											and entry fee for other players
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}
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
									: "Connect wallet to create lobby"}
							</Button>
						) : (
							<Button type="submit" disabled={isLoading}>
								{isLoading && (
									<Loader
										className="h-4 w-4 mr-1 animate-spin"
										size={17}
									/>
								)}
								{isLoading ? "Creating..." : "Create Lobby"}
							</Button>
						)}
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
