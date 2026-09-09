import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import Link from "next/link"


export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>carl's anatomy</CardTitle>
          <CardDescription>
            Interactive X-Ray Annotation
          </CardDescription>
        </CardHeader>
        <CardContent>
          disclaimer - this is a personal project and not affiliated with any medical institution. The content is for educational purposes only and should not be used for medical diagnosis or treatment.
        <Button className="w-full mt-4">
            <Link href="/dashboard">Enter</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}