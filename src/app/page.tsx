import Community from "./_components/community";
import Description from "./_components/description";
import HeroSection from "./_components/hero-section";
import Roadmap from "./_components/roadmap";

export default function LandingPage() {
	return (
		<div className="flex min-h-screen flex-col mx-auto">
			<main className="flex-1">
				<HeroSection />

				<Description />

				<Roadmap />

				<Community />
			</main>
		</div>
	);
}
