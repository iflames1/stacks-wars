"use client";

import { useState, useRef, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { SendHorizonal, MessageCircle, Users } from "lucide-react";
import { cn, truncateAddress } from "@/lib/utils";

type JsonParticipant = {
	id: string;
	display_name?: string;
	wallet_address: string;
};

interface ChatMessage {
	id: string;
	text: string;
	sender: JsonParticipant;
	timestamp: string;
}

const mockMessages: ChatMessage[] = [
	{
		id: "1",
		text: "Yo Flames, ready for Lexi Wars?",
		sender: {
			id: "user1",
			display_name: "Zion",
			wallet_address: "SP123ABC...",
		},
		timestamp: new Date().toISOString(),
	},
	{
		id: "2",
		text: "Always 🔥 Let's do this",
		sender: {
			id: "user2",
			display_name: "Flames",
			wallet_address: "SP999XYZ...",
		},
		timestamp: new Date().toISOString(),
	},
	{
		id: "3",
		text: "Stack or be stacked 😂",
		sender: {
			id: "user1",
			display_name: "Zion",
			wallet_address: "SP123ABC...",
		},
		timestamp: new Date().toISOString(),
	},
	{
		id: "4",
		text: "Good luck everyone! May the best words win 🎯",
		sender: {
			id: "user3",
			display_name: undefined,
			wallet_address: "SP456DEF789GHI...",
		},
		timestamp: new Date().toISOString(),
	},
];

const currentUserId = "user2"; // This would come from your auth context

export default function Chat() {
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<ChatMessage[]>(mockMessages);
	const [input, setInput] = useState("");
	const scrollAreaRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll to bottom when new messages arrive
	useEffect(() => {
		if (scrollAreaRef.current) {
			const scrollContainer = scrollAreaRef.current.querySelector(
				"[data-radix-scroll-area-viewport]"
			);
			if (scrollContainer) {
				scrollContainer.scrollTop = scrollContainer.scrollHeight;
			}
		}
	}, [messages]);

	// Focus input when dialog opens
	useEffect(() => {
		if (open && inputRef.current) {
			inputRef.current.focus();
		}
	}, [open]);

	const handleSend = () => {
		if (!input.trim()) return;

		const newMsg: ChatMessage = {
			id: crypto.randomUUID(),
			text: input,
			sender: {
				id: currentUserId,
				display_name: "Flames",
				wallet_address: "SP999XYZ...",
			},
			timestamp: new Date().toISOString(),
		};

		setMessages((prev) => [...prev, newMsg]);
		setInput("");
	};

	const formatTimestamp = (timestamp: string) => {
		return new Date(timestamp).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getDisplayName = (sender: JsonParticipant) => {
		return sender.display_name || truncateAddress(sender.wallet_address);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button
					variant="outline"
					className="fixed bottom-6 right-6 z-50 rounded-full p-4 shadow-lg bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20 hover:from-primary/20 hover:to-primary/30 backdrop-blur-sm"
				>
					<MessageCircle className="size-6 text-primary" />
					<span className="sr-only">Open chat</span>
				</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-lg w-full max-h-[85vh] p-0 gap-0 bg-primary/50">
				<DialogHeader className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-4 border-b border-primary/20">
					<div className="flex items-center gap-3">
						<Users className="h-5 w-5" />
						<div>
							<DialogTitle className="text-lg font-semibold">
								Game Chat
							</DialogTitle>
							<p className="text-sm text-primary-foreground/80">
								{messages.length} messages •{" "}
								{new Set(messages.map((m) => m.sender.id)).size}{" "}
								players
							</p>
						</div>
					</div>
				</DialogHeader>

				<div className="flex flex-col h-[500px]">
					<ScrollArea
						ref={scrollAreaRef}
						className="flex-1 px-4 py-3"
					>
						<div className="space-y-4">
							{messages.map((msg, index) => {
								const isOwnMessage =
									msg.sender.id === currentUserId;
								const showSenderInfo =
									index === 0 ||
									messages[index - 1].sender.id !==
										msg.sender.id;

								return (
									<div
										key={msg.id}
										className={cn(
											"flex flex-col",
											isOwnMessage
												? "items-end"
												: "items-start"
										)}
									>
										{showSenderInfo && !isOwnMessage && (
											<div className="flex items-center gap-2 mb-1 px-1">
												<div className="w-2 h-2 rounded-full bg-primary/60"></div>
												<span className="text-xs font-medium text-foreground">
													{getDisplayName(msg.sender)}
												</span>
												<span className="text-xs text-foreground/60">
													{formatTimestamp(
														msg.timestamp
													)}
												</span>
											</div>
										)}

										<div
											className={cn(
												"max-w-[85%] rounded-xl px-4 py-2 text-sm shadow-sm",
												"break-words whitespace-pre-wrap",
												isOwnMessage
													? "bg-primary text-primary-foreground rounded-br-md"
													: "bg-muted/80 text-foreground rounded-bl-md border border-primary/10"
											)}
										>
											{msg.text}
										</div>

										{isOwnMessage && showSenderInfo && (
											<span className="text-xs text-foreground/60 mt-1 px-1">
												{formatTimestamp(msg.timestamp)}
											</span>
										)}
									</div>
								);
							})}
						</div>
					</ScrollArea>

					<div className="border-t border-primary/20 bg-primary/5 p-4">
						<form
							onSubmit={(e) => {
								e.preventDefault();
								handleSend();
							}}
							className="flex items-center gap-3"
						>
							<div className="flex-1 relative">
								<Input
									ref={inputRef}
									value={input}
									onChange={(e) => setInput(e.target.value)}
									placeholder="Type your message... (Enter to send)"
									className="pr-12 bg-background/80 border-primary/20 focus:border-primary/40 focus:ring-primary/20"
									maxLength={500}
								/>
								<div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
									{input.length}/500
								</div>
							</div>
							<Button
								type="submit"
								size="icon"
								disabled={!input.trim()}
								className="bg-primary hover:bg-primary/90 shrink-0"
							>
								<SendHorizonal className="h-4 w-4" />
								<span className="sr-only">Send message</span>
							</Button>
						</form>

						<div className="text-xs text-muted-foreground/60 mt-2 text-center">
							Press Enter to send • Shift+Enter for new line
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
