import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

const queue = [
  { id: "IMG-1042", title: "Chest PA", tag: "Favorites", status: "Open", regions: 3 },
  { id: "IMG-1043", title: "Left Wrist", tag: "Unsorted", status: "Queued", regions: 1 },
  { id: "IMG-1044", title: "Lumbar Spine", tag: "Study Set", status: "Queued", regions: 4 },
  { id: "IMG-1045", title: "Right Knee", tag: "Archived", status: "Done", regions: 2 },
  { id: "IMG-1046", title: "Chest Lateral", tag: "Favorites", status: "Open", regions: 2 },
]

const annotations = [
  { id: 1, label: "Interesting shadow", color: "bg-red-500", author: "You", time: "2m ago", note: "Noticed a darker patch here — worth comparing with other scans." },
  { id: 2, label: "Small dot", color: "bg-amber-500", author: "You", time: "32m ago", note: "Tiny bright spot. Probably nothing, but flagging it to check later." },
  { id: 3, label: "Outline trace", color: "bg-blue-500", author: "You", time: "15m ago", note: "Traced the outer edge for reference. Pretty happy with how it lines up." },
]

function tagVariant(tag: string) {
  if (tag === "Favorites") return "default"
  if (tag === "Study Set") return "destructive"
  return "secondary"
}

export default function Home() {
  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Carl's Anatomy Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              X-ray Annotation and Review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">Import Images</Button>
            <Button size="sm">New Note</Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>CA</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Main grid: viewer + sidebar */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: viewer + notes */}
          <div className="lg:col-span-2 space-y-6">
            {/* X-ray viewer */}
            <Card className="overflow-hidden">
              <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-muted-foreground">🩻</span> Chest PA · IMG-1042
                    </CardTitle>
                    <CardDescription>Personal collection · imported Mar 2025</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1" />
                      3 regions
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">⛶</Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Image area */}
                <div className="relative bg-slate-900 p-5">
                  <div className="relative h-80 w-full rounded-lg bg-[radial-gradient(circle_at_30%_40%,#2f3e4e_0%,#0b1117_80%)] flex items-center justify-center shadow-inner">
                    {/* Faint shapes to suggest an image */}
                    <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 border-2 border-slate-600/30 rounded-full blur-sm" />
                    <div className="absolute left-1/3 top-1/3 w-1/3 h-1/3 border-2 border-slate-500/20 rounded-full blur-sm" />

                    {/* Region boxes */}
                    <div
                      className="absolute border-2 border-orange-500 bg-orange-500/10 rounded cursor-pointer hover:bg-orange-500/25 transition-all"
                      style={{ top: "30%", left: "20%", width: "18%", height: "20%" }}
                    >
                      <div className="absolute -top-7 left-0 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                        Interesting shadow
                      </div>
                    </div>
                    <div
                      className="absolute border-2 border-orange-500 bg-orange-500/10 rounded cursor-pointer hover:bg-orange-500/25 transition-all"
                      style={{ top: "55%", left: "60%", width: "12%", height: "14%" }}
                    >
                      <div className="absolute -top-7 left-0 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                        Small dot
                      </div>
                    </div>
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-500/10 rounded cursor-pointer hover:bg-blue-500/25 transition-all"
                      style={{ top: "50%", left: "45%", width: "20%", height: "15%" }}
                    >
                      <div className="absolute -top-7 left-0 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow-md whitespace-nowrap">
                        Outline trace
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                      zoom 100%
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="border-t px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    ✏️ Draw Region
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    🖍️ Highlight
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    📏 Measure
                  </Button>
                  <div className="flex-1" />
                  <span className="text-xs text-muted-foreground">💾 Saved</span>
                </div>
              </CardContent>
            </Card>

            {/* Notes card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    ✏️ My Notes
                  </CardTitle>
                  <CardDescription>Personal annotations on this image</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1">
                  + Add note
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {annotations.map((a) => (
                  <div key={a.id} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className={`h-2.5 w-2.5 rounded-full ${a.color}`} />
                        {a.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{a.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.note}</p>
                  </div>
                ))}
                <Textarea
                  placeholder="Jot down a thought about this image..."
                  className="min-h-[60px] text-sm resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Image queue */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>My Images</CardTitle>
                <CardDescription>Recent uploads and sets</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  {queue.map((row, i) => (
                    <div
                      key={row.id}
                      className={`flex items-center justify-between px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 ${
                        i === 0 ? "bg-blue-50/40 border-l-2 border-l-blue-600" : ""
                      }`}
                    >
                      <div>
                        <div className="font-medium text-sm">{row.id} · {row.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.tag} · {row.regions} regions
                        </div>
                      </div>
                      <Badge variant={tagVariant(row.tag)} className="text-[10px]">
                        {row.status}
                      </Badge>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}