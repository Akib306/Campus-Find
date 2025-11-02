import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BaselineCheckCircleOutline } from "@/components/icons/baseline-check-circle-outline";
import { Button } from "@/components/ui/button";
import { WarningIcon } from "@/components/icons/warning";

export default async function Page(
  {
    searchParams 
  }: 
  { 
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
  }
) {
  
  const params = await searchParams;
  const rawEmail = params?.email;
  let email = "";
  if (typeof rawEmail === "string") {
    email = rawEmail;
  } else if (Array.isArray(rawEmail)) {
    email = rawEmail.length > 0 ? rawEmail[0] : "";
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Check your email
              </CardTitle>
              <CardDescription> We&apos;ve sent a verification email to: <span className="font-bold">{email}</span></CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex flex-row items-center gap-2">
                <BaselineCheckCircleOutline /> Click the verification link in the email
              </div>
              <div className="flex flex-row items-center gap-2">
                <BaselineCheckCircleOutline /> You will be redirected to the login page
              </div>
              <Button className="w-full mt-4">
                {/* Open Outlook in a new tab */}
                <a
                  href={`https://outlook.office.com/mail/inbox?exid=${encodeURIComponent(email)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Outlook Inbox
                </a>
              </Button>
            </CardContent>
          </Card>
          <div className="flex flex-row items-center gap-2 pl-6 bg-accent/10 rounded-lg p-4 text-sm text-muted-foreground">
            <WarningIcon /> If you don&apos;t see the email within a few minutes, check your spam folder.
          </div>
        </div>
      </div>
    </div>
  );
}
