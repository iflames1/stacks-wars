import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RefObject } from "react";

interface LexiInputFormProps {
	word: string;
	setWord: (word: string) => void;
	isTouchDevice: boolean;
	inputRef: RefObject<HTMLInputElement | null>;
	handleSubmit: (e?: React.FormEvent) => void;
}

export default function LexiInputForm({
	word,
	setWord,
	isTouchDevice,
	inputRef,
	handleSubmit,
}: LexiInputFormProps) {
	const handlePaste = (e: React.ClipboardEvent) => {
		e.preventDefault();
		toast.error("Pasting is not permited!", { position: "top-center" });
	};

	const handleCopy = (e: React.ClipboardEvent) => {
		e.preventDefault();
		toast.error("Copying is not permited!", { position: "top-center" });
	};

	const handleCut = (e: React.ClipboardEvent) => {
		e.preventDefault();
		toast.error("Cutting is not permited!", { position: "top-center" });
	};

	//console.log("isTouchDevice", isTouchDevice);

	return (
		<form
			onSubmit={handleSubmit}
			autoComplete="off"
			className="space-y-3 sm:space-y-4"
		>
			<Input
				ref={inputRef}
				type="text"
				placeholder={"Type your word here..."}
				onClick={() => inputRef.current?.focus()}
				value={word}
				onChange={
					!isTouchDevice ? (e) => setWord(e.target.value) : undefined
				}
				onPaste={handlePaste}
				onCopy={handleCopy}
				onCut={handleCut}
				//disabled={!isPlaying || timeLeft === 0}
				className="text-lg sm:text-xl sm:px-4 h-12"
				//className="absolute opacity-0 pointer-events-none h-0 w-0"
				autoComplete="off"
				aria-hidden={isTouchDevice}
				aria-autocomplete="none"
				autoCorrect="off"
				inputMode="none"
				spellCheck="false"
				autoCapitalize="off"
				readOnly={isTouchDevice}
				autoFocus={!isTouchDevice}
			/>

			<div className="flex justify-end">
				<Button type="submit" size="lg" className="w-full md:w-fit">
					Submit
				</Button>
			</div>
		</form>
	);
}
