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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { apiRequest, ApiRequestProps } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getClaimFromJwt } from "@/lib/getClaimFromJwt";
import { nanoid } from "nanoid";
import {
	createSponsoredGamePool,
	createSponsoredFtGamePool,
} from "@/lib/actions/createGamePool";
import {
	joinSponsoredGamePool,
	joinSponsoredFtGamePool,
} from "@/lib/actions/joinGamePool";
import { waitForTxConfirmed } from "@/lib/actions/waitForTxConfirmed";
import { useConnectUser } from "@/contexts/ConnectWalletContext";
import { TokenMetadata } from "@/types/schema/token";
import { formatNumber } from "@/lib/utils";

interface FormData {
	name: string;
	description?: string;
	token: string;
	poolSize: number;
}

interface TokenBalance {
	contract: string;
	symbol: string;
	name: string;
	balance: string;
	decimals: number;
}

interface CreateSponsoredLobbyFormProps {
	gameId: string;
}

export default function CreateSponsoredLobbyForm({
	gameId,
}: CreateSponsoredLobbyFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [loadingTokens, setLoadingTokens] = useState(false);
	const { isConnecting, isConnected, handleConnect, user } = useConnectUser();
	const [availableTokens, setAvailableTokens] = useState<TokenBalance[]>([]);
	const [selectedTokenMetadata, setSelectedTokenMetadata] =
		useState<TokenMetadata | null>(null);
	const [minPoolSize, setMinPoolSize] = useState<number>(50);
	const [deployedContract, setDeployedContract] = useState<{
		contractName: string;
		contractAddress: `${string}.${string}`;
		poolSize: number;
		txId: string;
		token: string;
	} | null>(null);
	const [joined, setJoined] = useState<{
		contractAddress: `${string}.${string}`;
		txId: string;
		poolSize: number;
		token: string;
	} | null>(null);
	const prevPoolSizeRef = useRef<number | undefined>(undefined);
	const prevTokenRef = useRef<string | undefined>(undefined);

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
		token: z.string().min(1, {
			message: "Please select a token.",
		}),
		poolSize: z.number().min(selectedTokenMetadata?.priceUsd || 50, {
			message: `Pool size must be greater than ${selectedTokenMetadata?.minimumAmount || 0}`,
		}),
	});

	const form = useForm<FormData>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			name: "",
			token: "STX",
		},
		mode: "onChange",
	});

	const poolSize = useWatch({
		control: form.control,
		name: "poolSize",
	});

	const selectedToken = useWatch({
		control: form.control,
		name: "token",
	});

	// Fetch available tokens when user is connected
	useEffect(() => {
		if (isConnected && user?.walletAddress) {
			fetchAvailableTokens(user.walletAddress);
		}
	}, [isConnected, user?.walletAddress]);

	// Reset contract when pool size or token changes
	useEffect(() => {
		const poolSizeChanged =
			prevPoolSizeRef.current !== undefined &&
			poolSize !== prevPoolSizeRef.current;

		const tokenChanged =
			prevTokenRef.current !== undefined &&
			selectedToken !== prevTokenRef.current;

		if (deployedContract && (poolSizeChanged || tokenChanged)) {
			console.log(
				"⚠️ Pool configuration changed, resetting deployed contract"
			);
			setDeployedContract(null);
			setJoined(null);
		}

		prevPoolSizeRef.current = poolSize;
		prevTokenRef.current = selectedToken;
	}, [deployedContract, poolSize, selectedToken]);

	const fetchTokenMetadata = useCallback(async (contract_id: string) => {
		try {
			const metadata = await apiRequest<TokenMetadata>({
				path: `/token_info/testnet/${contract_id}`,
				method: "GET",
			});

			setSelectedTokenMetadata(metadata);
			setMinPoolSize(metadata.minimumAmount);
		} catch (error) {
			console.error("Failed to fetch token metadata:", error);
			setMinPoolSize(0);
			toast.error("Failed to load token information");
		}
	}, []);

	// Fetch token metadata and calculate minimum pool size
	useEffect(() => {
		if (selectedToken && selectedToken !== "STX") {
			fetchTokenMetadata(selectedToken);
		} else if (selectedToken === "STX") {
			fetchTokenMetadata("stx");
		} else {
			setSelectedTokenMetadata(null);
			setMinPoolSize(0);
		}
	}, [selectedToken, fetchTokenMetadata, form]);

	const fetchAvailableTokens = async (walletAddress: string) => {
		setLoadingTokens(true);
		try {
			const response = await fetch(
				`https://api.testnet.hiro.so/extended/v1/address/${walletAddress}/balances?unanchored=true`
			);
			const data = await response.json();

			const tokens: TokenBalance[] = [
				{
					contract: "STX",
					symbol: "STX",
					name: "Stacks",
					balance: data.stx.balance,
					decimals: 6,
				},
			];

			// Process fungible tokens
			if (data.fungible_tokens) {
				for (const [contractFull, tokenData] of Object.entries(
					data.fungible_tokens
				)) {
					const tokenBalance = tokenData as { balance: string };

					if (parseInt(tokenBalance.balance) > 0) {
						// Extract token name from contract address
						// Format: CONTRACT_ADDRESS::TOKEN_NAME
						const parts = contractFull.split("::");
						if (parts.length === 2) {
							const contract = parts[0];
							const tokenName = parts[1];

							tokens.push({
								contract,
								symbol: tokenName.toUpperCase(),
								name: tokenName,
								balance: tokenBalance.balance,
								decimals: 6, // Default, will be updated with metadata
							});
						}
					}
				}
			}

			setAvailableTokens(tokens);
		} catch (error) {
			console.error("Failed to fetch token balances:", error);
			toast.error("Failed to load available tokens");
		} finally {
			setLoadingTokens(false);
		}
	};

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
				let tokenSymbol = "stx";
				if (values.token === "STX") {
					tokenSymbol = "stx";
				} else if (selectedTokenMetadata) {
					tokenSymbol = selectedTokenMetadata.symbol.toLowerCase();
				}

				const contractName = `${nanoid(5)}-sponsored-${tokenSymbol}-wars`;
				const contract: `${string}.${string}` = `${deployerAddress}.${contractName}`;

				let deployTx;

				if (values.token === "STX") {
					deployTx = await createSponsoredGamePool(
						values.poolSize,
						contractName,
						deployerAddress
					);
				} else {
					if (!selectedTokenMetadata) {
						throw new Error("Token metadata not loaded");
					}
					const tokenContract: `'${string}.${string}` = `'${values.token as `${string}.${string}`}`;
					deployTx = await createSponsoredFtGamePool(
						tokenContract,
						selectedTokenMetadata.symbol.toLowerCase(),
						values.poolSize,
						contractName,
						deployerAddress
					);
				}

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
					token: values.token,
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
				let joinTxId;

				if (values.token === "STX") {
					joinTxId = await joinSponsoredGamePool(
						contractInfo.contractAddress,
						true,
						contractInfo.poolSize
					);
				} else {
					if (!selectedTokenMetadata) {
						throw new Error("Token metadata not loaded");
					}

					joinTxId = await joinSponsoredFtGamePool(
						contractInfo.contractAddress,
						values.token as `${string}.${string}`,
						true,
						contractInfo.poolSize
					);
				}

				if (!joinTxId) {
					throw new Error(
						"Failed to join sponsored game pool: missing transaction ID"
					);
				}

				try {
					await waitForTxConfirmed(joinTxId);
					console.log("✅ Sponsored Join Transaction confirmed!");
				} catch (err) {
					console.error("❌ TX failed or aborted:", err);
					throw err;
				}

				joinInfo = {
					contractAddress: contractInfo.contractAddress,
					txId: joinTxId,
					poolSize: contractInfo.poolSize,
					token: values.token,
				};
				setJoined(joinInfo);
				tx_id = joinTxId;
			}

			let tokenSymbol = "STX";
			if (values.token === "STX") {
				tokenSymbol = "STX";
			} else if (selectedTokenMetadata) {
				tokenSymbol = selectedTokenMetadata.symbol.toUpperCase();
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
					token_symbol: tokenSymbol,
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

						{/* Grouped Pool Size Section */}
						<div className="space-y-2">
							<FormLabel className="inline-flex items-center gap-1">
								Pool Size
								<span className="text-destructive">*</span>
							</FormLabel>

							<div className="flex gap-4">
								<FormField
									control={form.control}
									name="token"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Select
													onValueChange={
														field.onChange
													}
													defaultValue={field.value}
												>
													<SelectTrigger>
														<SelectValue placeholder="Token" />
													</SelectTrigger>
													<SelectContent>
														{loadingTokens ? (
															<SelectItem
																value="loading"
																disabled
															>
																<div className="flex items-center gap-2">
																	<Loader className="h-4 w-4 animate-spin" />
																	Loading
																	tokens...
																</div>
															</SelectItem>
														) : (
															availableTokens.map(
																(token) => (
																	<SelectItem
																		key={
																			token.contract
																		}
																		value={
																			token.contract
																		}
																	>
																		<div className="flex items-center justify-between w-full">
																			<span>
																				{
																					token.symbol
																				}
																			</span>
																			<span className="text-xs text-muted-foreground ml-2 font-mono">
																				{formatNumber(
																					parseInt(
																						token.balance
																					) /
																						Math.pow(
																							10,
																							token.decimals
																						)
																				)}
																			</span>
																		</div>
																	</SelectItem>
																)
															)
														)}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="poolSize"
									render={({ field }) => {
										const getStepValue = () => {
											if (
												selectedTokenMetadata?.priceUsd
											) {
												if (
													selectedTokenMetadata.priceUsd >=
													1
												)
													return 0.000001;
												if (
													selectedTokenMetadata.priceUsd >=
													0.01
												)
													return 0.01;
												if (
													selectedTokenMetadata.priceUsd >=
													0.001
												)
													return 0.1;
												return 1;
											}

											// For STX or when no metadata, calculate based on minPoolSize precision
											const minStr =
												minPoolSize.toString();
											if (minStr.includes(".")) {
												const decimals =
													minStr.split(".")[1].length;
												return (
													1 / Math.pow(10, decimals)
												);
											}

											return 0.01; // Default step for STX
										};

										return (
											<FormItem className="w-full">
												<FormControl>
													<Input
														type="number"
														placeholder={`Min: ${minPoolSize}`}
														min={minPoolSize}
														step={getStepValue()}
														value={
															field.value || ""
														}
														onChange={(e) => {
															const value =
																e.target.value;
															field.onChange(
																value === ""
																	? undefined
																	: parseFloat(
																			value
																		)
															);
														}}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</div>

							<p className="text-sm text-muted-foreground">
								This is the total prize pool you&apos;ll
								sponsor. Players can join for free.
								{selectedTokenMetadata && (
									<>
										<br />
										<span className="font-medium">
											Minimum: {minPoolSize}{" "}
											{selectedTokenMetadata.symbol} (≈$
											30 USD)
										</span>
									</>
								)}
								{!selectedTokenMetadata && selectedToken && (
									<>
										<br />
										<span className="font-medium">
											Minimum: {minPoolSize}{" "}
											{selectedToken} (≈$30 USD)
										</span>
									</>
								)}
							</p>
						</div>
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
