import { connectWebSocketClient } from "@stacks/blockchain-api-client";

export const waitForTxConfirmed = async (txId: string): Promise<void> => {
	console.log("waitForTxConfirmed → starting");
	const controller = new AbortController();

	let resolvePromise: () => void;
	let rejectPromise: (reason?: unknown) => void;
	let wsUnsub: () => void = () => {};

	const combined = new Promise<void>((resolve, reject) => {
		resolvePromise = resolve;
		rejectPromise = reject;
	});

	const pollTx = async () => {
		const check = async () => {
			const res = await fetch(
				`https://api.testnet.hiro.so/extended/v1/tx/${txId}`,
				{ signal: controller.signal }
			);
			if (!res.ok) throw new Error("Failed to fetch tx status");

			const data = await res.json();
			console.log("🔁 polling tx status:", data.tx_status);

			if (data.tx_status === "success") {
				resolvePromise();
				controller.abort();
				wsUnsub();
				return true;
			}
			if (
				data.tx_status === "abort_by_response" ||
				data.tx_status === "abort_by_post_condition"
			) {
				rejectPromise(new Error("Transaction failed or was aborted"));
				controller.abort();
				wsUnsub();
				return true;
			}
			return false;
		};

		const done = await check();
		if (done) return;

		// ⏱ Poll every 30 seconds
		const interval = setInterval(async () => {
			try {
				const done = await check();
				if (done) clearInterval(interval);
			} catch (err) {
				clearInterval(interval);
				rejectPromise(err);
			}
		}, 30_000);
	};

	const listenWebSocket = async () => {
		const client = await connectWebSocketClient(
			"wss://api.testnet.hiro.so/"
		);
		const sub = await client.subscribeTxUpdates(txId, (event) => {
			console.log("📡 [Tx Event]", event);

			if (event.tx_status === "success") {
				sub.unsubscribe();
				controller.abort();
				resolvePromise();
			}
			if (
				event.tx_status === "abort_by_response" ||
				event.tx_status === "abort_by_post_condition"
			) {
				sub.unsubscribe();
				controller.abort();
				rejectPromise(new Error("Transaction failed or was aborted"));
			}
		});

		wsUnsub = () => sub.unsubscribe();
	};

	// Run both in parallel
	await Promise.allSettled([listenWebSocket(), pollTx()]);
	return combined.finally(() => {
		controller.abort();
		wsUnsub();
	});
};
