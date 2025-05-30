import KeyboardReact from "react-simple-keyboard";
import "react-simple-keyboard/build/css/index.css";
import "./keyboard-theme.css";

const layout = {
	default: [
		"q w e r t y u i o p",
		"a s d f g h j k l",
		"{shift} z x c v b n m {bksp}",
		"{enter}",
	],
	shift: [
		"~ ! @ # $ % ^ &amp; * ( ) _ + {bksp}",
		"{tab} Q W E R T Y U I O P { } |",
		'{lock} A S D F G H J K L : " {enter}',
		"{shift} Z X C V B N M &lt; &gt; ? {shift}",
		".com @ {space}",
	],
};

const display = {
	"{bksp}": "⌫",
	"{enter}": "Send",
	"{shift}": "⇧",
	"{tab}": "⇥",
	"{lock}": "⇪",
	"{space}": " ",
};

export default function Keyboard() {
	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 ">
			<div className="max-w-3xl mx-auto hg-theme-default">
				<KeyboardReact
					layout={layout}
					display={display}
					mergeDisplay={true}
				/>
			</div>
		</div>
	);
}

//function KeyboardComp({
//	handleKeyboardInput,
//}: {
//	handleKeyboardInput: (input: string) => void;
//}) {
//	const keyboardRef = useRef(null);

//	return (
//		<div className="keyboard">
//			<KeyboardReact
//				keyboardRef={(r) => (keyboardRef.current = r)}
//				layoutName="default"
//				layout={layout}
//				display={{
//					"{bksp}": "⌫",
//					"{enter}": "Enter",
//				}}
//				onKeyPress={handleKeyboardInput}
//				disableButtonHold
//				physicalKeyboardHighlight={false}
//			/>
//		</div>
//	);
//}
