import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BaselineCheckCircleOutline } from "@/components/icons/baseline-check-circle-outline";

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
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Check your email
              </CardTitle>
              <CardDescription>We've sent a verifcation email to: {email}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You&apos;ve successfully signed up. Please check your email to
                confirm your account before signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
