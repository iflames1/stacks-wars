import { ReactNode } from "react";

interface LexiWarsLayoutProps {
	params: Promise<{ id: string }>;
	children: ReactNode;
}

export default async function LexiWarsLayout({
	params,
	children,
}: LexiWarsLayoutProps) {
	const { id } = await params;
	console.log("room id:", id);
	return <main className="flex-1">{children}</main>;
}
