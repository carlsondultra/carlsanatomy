import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>carl's anatomy dashboard</CardTitle>
          <CardDescription>
            dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
            dashboard content
        </CardContent>
      </Card>
    </div>
  )
}