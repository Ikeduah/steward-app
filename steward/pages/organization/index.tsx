import { OrganizationProfile } from "@clerk/nextjs";
import { Layout } from "../../components/Layout";

export default function OrganizationPage() {
    return (
        <Layout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-black">Team Settings</h1>
                    <p className="text-gray-500 mt-2">Manage your organization members and settings.</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Clerk's OrganizationProfile handles all the heavy lifting: invites, roles, settings */}
                    <OrganizationProfile
                        routing="hash"
                        appearance={{
                            elements: {
                                card: "shadow-none border-0",
                                rootBox: "w-full h-full",
                                scrollBox: "w-full h-full"
                            }
                        }}
                    />
                </div>
            </div>
        </Layout>
    );
}
