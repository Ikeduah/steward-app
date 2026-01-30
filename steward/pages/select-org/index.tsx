import { OrganizationList } from "@clerk/nextjs";

export default function SelectOrganizationPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 text-center">
                <div>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Select Your Team
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Create a new organization or select an existing one to continue.
                    </p>
                </div>

                <div className="flex justify-center">
                    <OrganizationList
                        afterSelectOrganizationUrl="/dashboard"
                        afterCreateOrganizationUrl="/dashboard"
                        hidePersonal={true}
                        skipInvitationScreen={true}
                    />
                </div>
            </div>
        </div>
    );
}
