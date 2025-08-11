"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/types/schema/user";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Edit, Save, X } from "lucide-react";

interface ProfileEditProps {
	user: User;
}

export default function ProfileEdit({ user }: ProfileEditProps) {
	const [isEditingUsername, setIsEditingUsername] = useState(false);
	const [isEditingDisplayName, setIsEditingDisplayName] = useState(false);
	const [username, setUsername] = useState(user.username || "");
	const [displayName, setDisplayName] = useState(user.displayName || "");
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleUpdateUsername = async () => {
		if (!username.trim()) {
			toast.error("Username cannot be empty");
			return;
		}

		setLoading(true);
		try {
			await apiRequest({
				path: "/user/username",
				method: "PATCH",
				body: { username: username.trim() },
			});

			toast.success("Username updated successfully!");
			setIsEditingUsername(false);
			router.refresh();
		} catch (error) {
			console.error("Failed to update username:", error);
			toast.error("Failed to update username. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleUpdateDisplayName = async () => {
		setLoading(true);
		try {
			await apiRequest({
				path: "/user/display_name",
				method: "PATCH",
				body: { displayName: displayName.trim() || null },
			});

			toast.success("Display name updated successfully!");
			setIsEditingDisplayName(false);
			router.refresh();
		} catch (error) {
			console.error("Failed to update display name:", error);
			toast.error("Failed to update display name. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const cancelEditUsername = () => {
		setUsername(user.username || "");
		setIsEditingUsername(false);
	};

	const cancelEditDisplayName = () => {
		setDisplayName(user.displayName || "");
		setIsEditingDisplayName(false);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Edit className="h-5 w-5" />
					Edit Profile
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Username Section */}
				{!user.username || isEditingUsername ? (
					<div className="space-y-2">
						<Label htmlFor="username">Username</Label>
						{isEditingUsername ? (
							<div className="flex gap-2">
								<Input
									id="username"
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
									placeholder="Enter username"
									disabled={loading}
								/>
								<Button
									size="sm"
									onClick={handleUpdateUsername}
									disabled={loading || !username.trim()}
								>
									<Save className="h-4 w-4" />
								</Button>
								<Button
									size="sm"
									variant="outline"
									onClick={cancelEditUsername}
									disabled={loading}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						) : (
							<div className="flex gap-2">
								<Input
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
									placeholder="Add a username"
								/>
								<Button
									size="sm"
									onClick={() => setIsEditingUsername(true)}
								>
									<Edit className="h-4 w-4" />
								</Button>
							</div>
						)}
						{!user.username && (
							<p className="text-sm text-muted-foreground">
								Add a username to make your profile easier to
								find
							</p>
						)}
					</div>
				) : (
					<div className="space-y-2">
						<Label>Username</Label>
						<div className="flex gap-2">
							<Input value={`@${user.username}`} disabled />
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsEditingUsername(true)}
							>
								<Edit className="h-4 w-4" />
							</Button>
						</div>
					</div>
				)}

				{/* Display Name Section */}
				<div className="space-y-2">
					<Label htmlFor="displayName">Display Name</Label>
					{isEditingDisplayName ? (
						<div className="flex gap-2">
							<Input
								id="displayName"
								value={displayName}
								onChange={(e) => setDisplayName(e.target.value)}
								placeholder="Enter display name"
								disabled={loading}
							/>
							<Button
								size="sm"
								onClick={handleUpdateDisplayName}
								disabled={loading}
							>
								<Save className="h-4 w-4" />
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={cancelEditDisplayName}
								disabled={loading}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					) : (
						<div className="flex gap-2">
							<Input
								value={displayName || ""}
								placeholder={
									user.displayName
										? user.displayName
										: "Add a display name"
								}
								disabled
							/>
							<Button
								size="sm"
								variant="outline"
								onClick={() => setIsEditingDisplayName(true)}
							>
								<Edit className="h-4 w-4" />
							</Button>
						</div>
					)}
					<p className="text-sm text-muted-foreground">
						Your display name is shown to other players
					</p>
				</div>
			</CardContent>
		</Card>
	);
}
