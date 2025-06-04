import Header from "@/components/header";
import Footer from "@/components/footer";

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<>
			<Header />
			<main className="flex-1 bg-primary/10">{children}</main>
			<Footer />
		</>
	);
}
