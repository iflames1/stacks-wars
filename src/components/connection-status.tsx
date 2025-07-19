interface ConnectionStatusProps {
	readyState: WebSocket["readyState"];
	latency: number | null;
	className?: string;
}
export default function ConnectionStatus({
	readyState,
	latency,
	className,
}: ConnectionStatusProps) {
	const getLatencyColor = (ms: number) => {
		if (ms <= 60) return "text-green-500"; // very good
		if (ms <= 120) return "text-yellow-500"; // good
		if (ms <= 250) return "text-orange-500"; // bad
		return "text-red-500"; // very bad
	};

	const getConnectionStatus = () => {
		if (
			readyState === WebSocket.CONNECTING ||
			readyState === WebSocket.CLOSED
		) {
			return (
				<span className={`text-xs text-blue-500 block ${className}`}>
					connecting...
				</span>
			);
		}

		if (latency !== null && readyState === WebSocket.OPEN) {
			return (
				<span
					className={`text-xs block ${className} ${getLatencyColor(latency)}`}
				>
					{Math.min(latency, 999)}ms
				</span>
			);
		}

		return null;
	};

	return getConnectionStatus();
}
