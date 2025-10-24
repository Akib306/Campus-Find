import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BaselineCheckCircleOutline } from "@/components/icons/baseline-check-circle-outline";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page(
  {
    searchParams 
  }: 
  { 
    searchParams: { email: string }
  }
) {
  const email: string = searchParams?.email ? searchParams.email : "";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Check your email
              </CardTitle>
              <CardDescription>We've sent a verifcation email to: <span className="font-bold">{email}</span></CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              <div className="flex flex-row items-center gap-2">
                <BaselineCheckCircleOutline /> Click the verifcation link in the email
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
        </div>
      </div>
    </div>
  );
}
