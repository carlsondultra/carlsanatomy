"use client"

import { useState, useRef, useEffect } from "react"

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

import { supabase } from "@/lib/supabase"

const annotations = [
  { id: 1, label: "Interesting shadow", color: "bg-red-500", author: "You", time: "2m ago", note: "Noticed a darker patch here — worth comparing with other scans." },
  { id: 2, label: "Small dot", color: "bg-amber-500", author: "You", time: "32m ago", note: "Tiny bright spot. Probably nothing, but flagging it to check later." },
  { id: 3, label: "Outline trace", color: "bg-blue-500", author: "You", time: "15m ago", note: "Traced the outer edge for reference. Pretty happy with how it lines up." },
]

type Circle = {
  id: string // uuid from DB
  x: number // 0-100 (% of container width)
  y: number // 0-100 (% of container height)
  r: number // radius in % of container width
  note: string
}

type StoredImage = {
  name: string
  url: string
  createdAt: string | null
}

type Note = {
  id: string
  image_name: string
  body: string
  author: string | null
  created_at: string
}

function friendlyName(name: string) {
  const stripped = name.replace(/^[0-9a-f-]{36}-/i, "")
  return stripped.replace(/\.[^.]+$/, "") || name
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—"
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [circles, setCircles] = useState<Circle[]>([])
  const [drawMode, setDrawMode] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const [images, setImages] = useState<StoredImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(true)
  const [imagesError, setImagesError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<StoredImage | null>(null)

  // Notes state
  const [notes, setNotes] = useState<Note[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteDraft, setNoteDraft] = useState("")
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Fullscreen state & ref
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  async function loadImages() {
    setImagesLoading(true)
    setImagesError(null)
    try {
      const { data, error } = await supabase.storage
        .from("xrays")
        .list("", {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        })

      if (error) throw error

      const list: StoredImage[] = (data ?? [])
        .filter((f) => f.name && !f.name.endsWith("/"))
        .map((f) => {
          const { data: urlData } = supabase.storage
            .from("xrays")
            .getPublicUrl(f.name)
          return {
            name: f.name,
            url: urlData.publicUrl,
            createdAt: f.created_at ?? null,
          }
        })

      setImages(list)
    } catch (err) {
      console.error("Failed to list images:", err)
      setImagesError(err instanceof Error ? err.message : "Failed to load images")
    } finally {
      setImagesLoading(false)
    }
  }

  useEffect(() => {
    loadImages()
  }, [])

  // Track fullscreen changes (also handles ESC exit)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  async function toggleFullscreen() {
    const el = imageContainerRef.current
    if (!el) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        // Safari / older browser fallbacks
        const anyEl = el as any
        if (el.requestFullscreen) {
          await el.requestFullscreen()
        } else if (anyEl.webkitRequestFullscreen) {
          await anyEl.webkitRequestFullscreen()
        } else if (anyEl.msRequestFullscreen) {
          await anyEl.msRequestFullscreen()
        }
      }
    } catch (err) {
      console.error("Fullscreen failed:", err)
    }
  }

  async function loadAnnotations(imageName: string) {
    const { data, error } = await supabase
      .from("annotations")
      .select("id, x, y, r, note")
      .eq("image_name", imageName)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Failed to load annotations:", error)
      return
    }
    setCircles(data ?? [])
  }

  async function loadNotes(imageName: string) {
    setNotesLoading(true)
    const { data, error } = await supabase
      .from("notes")
      .select("id, image_name, body, author, created_at")
      .eq("image_name", imageName)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to load notes:", error)
      setNotes([])
    } else {
      setNotes(data ?? [])
    }
    setNotesLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError(null)

    try {
      const path = `${crypto.randomUUID()}-${file.name}`

      const { data, error } = await supabase.storage
        .from("xrays")
        .upload(path, file, { cacheControl: "3600" })

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from("xrays")
        .getPublicUrl(data.path)

      setImageUrl(urlData.publicUrl)
      setActiveImage({
        name: data.path,
        url: urlData.publicUrl,
        createdAt: new Date().toISOString(),
      })
      await loadAnnotations(data.path)
      await loadNotes(data.path)
      await loadImages()
    } catch (err) {
      console.error("Upload failed:", err)
      setUploadError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      // reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function selectImage(img: StoredImage) {
    setActiveImage(img)
    setImageUrl(img.url)
    setDrawMode(false)
    setCircles([]) // clear immediately so no stale circles flash
    setNotes([])   // clear stale notes too
    setNoteDraft("")
    loadAnnotations(img.name)
    loadNotes(img.name)
  }

  async function handleImageClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!drawMode || !imageUrl || !activeImage) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    const note = window.prompt("Note for this annotation:") ?? ""

    // Optimistic: show immediately with a temp id
    const tempId = crypto.randomUUID()
    const optimistic: Circle = { id: tempId, x, y, r: 6, note }
    setCircles((prev) => [...prev, optimistic])
    setDrawMode(false)

    const { data, error } = await supabase
      .from("annotations")
      .insert({
        image_name: activeImage.name,
        x,
        y,
        r: 6,
        note,
        // user_id: (await supabase.auth.getUser()).data.user?.id, // if using auth
      })
      .select("id")
      .single()

    if (error) {
      console.error("Failed to save annotation:", error)
      // roll back the optimistic insert
      setCircles((prev) => prev.filter((c) => c.id !== tempId))
      return
    }

    // swap temp id for real DB id
    setCircles((prev) =>
      prev.map((c) => (c.id === tempId ? { ...c, id: data.id } : c))
    )
  }

  async function handleCircleClick(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (!window.confirm("Delete this annotation?")) return

    // Optimistic removal
    const snapshot = circles
    setCircles((prev) => prev.filter((c) => c.id !== id))

    const { error } = await supabase.from("annotations").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete annotation:", error)
      setCircles(snapshot) // restore on failure
    }
  }

  async function saveNote() {
    const body = noteDraft.trim()
    if (!body || !activeImage) return

    // Optimistic insert
    const tempId = crypto.randomUUID()
    const optimistic: Note = {
      id: tempId,
      image_name: activeImage.name,
      body,
      author: "You",
      created_at: new Date().toISOString(),
    }
    setNotes((prev) => [optimistic, ...prev])
    setNoteDraft("")

    const { data, error } = await supabase
      .from("notes")
      .insert({
        image_name: activeImage.name,
        body,
        author: "You",
        // user_id: (await supabase.auth.getUser()).data.user?.id,
      })
      .select("id, image_name, body, author, created_at")
      .single()

    if (error) {
      console.error("Failed to save note:", error)
      setNotes((prev) => prev.filter((n) => n.id !== tempId)) // roll back
      return
    }

    setNotes((prev) => prev.map((n) => (n.id === tempId ? data : n)))
  }

  async function handleDeleteNote(id: string) {
    if (!window.confirm("Delete this note?")) return

    const snapshot = notes
    setNotes((prev) => prev.filter((n) => n.id !== id))

    const { error } = await supabase.from("notes").delete().eq("id", id)
    if (error) {
      console.error("Failed to delete note:", error)
      setNotes(snapshot)
    }
  }

  function focusNoteInput() {
    noteTextareaRef.current?.focus()
  }

  return (
    <div className="min-h-screen bg-muted/40 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Carl&apos;s Anatomy Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              X-ray Annotation and Review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Import Images"}
            </Button>
            <Button size="sm" disabled={!activeImage} onClick={focusNoteInput}>
              New Note
            </Button>
            <Avatar className="h-8 w-8">
              <AvatarFallback>CA</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {uploadError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {uploadError}
          </div>
        )}

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
                      <span className="text-muted-foreground">🩻</span>{" "}
                      {activeImage ? friendlyName(activeImage.name) : "No image selected"}
                    </CardTitle>
                    <CardDescription>
                      {activeImage?.createdAt
                        ? `Imported ${formatDate(activeImage.createdAt)}`
                        : "Import an image or pick one from the sidebar"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1" />
                      {circles.length} region{circles.length === 1 ? "" : "s"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={toggleFullscreen}
                      disabled={!imageUrl}
                      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                    >
                      {isFullscreen ? "⤢" : "⛶"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Image area */}
                <div className="relative bg-slate-900 p-5">
                  <div
                    ref={imageContainerRef}
                    onClick={handleImageClick}
                    className={`relative w-full rounded-lg overflow-hidden bg-[radial-gradient(circle_at_30%_40%,#2f3e4e_0%,#0b1117_80%)] flex items-center justify-center shadow-inner ${
                      isFullscreen ? "h-screen" : "h-80"
                    } ${drawMode ? "cursor-crosshair" : ""}`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Uploaded X-ray"
                        className="absolute inset-0 h-full w-full object-contain pointer-events-none"
                      />
                    ) : (
                      <>
                        {/* Faint shapes to suggest an image */}
                        <div className="absolute left-1/4 top-1/4 w-1/2 h-1/2 border-2 border-slate-600/30 rounded-full blur-sm" />
                        <div className="absolute left-1/3 top-1/3 w-1/3 h-1/3 border-2 border-slate-500/20 rounded-full blur-sm" />
                      </>
                    )}

                    {/* Interactive circle overlays */}
                    {circles.map((c) => (
                      <div
                        key={c.id}
                        onMouseEnter={() => setHoveredId(c.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={(e) => handleCircleClick(e, c.id)}
                        className={`absolute rounded-full border-2 cursor-pointer transition-colors ${
                          hoveredId === c.id
                            ? "border-orange-300 ring-2 ring-orange-300/50 bg-orange-400/30"
                            : "border-orange-400 bg-orange-400/15 hover:bg-orange-400/30"
                        }`}
                        style={{
                          left: `${c.x}%`,
                          top: `${c.y}%`,
                          width: `${c.r * 2}%`,
                          aspectRatio: "1 / 1",
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        {hoveredId === c.id && (
                          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 rounded-md bg-slate-800 text-white text-xs px-3 py-2 shadow-lg pointer-events-none z-10">
                            {c.note || "(no note)"}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-800 rotate-45" />
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="absolute bottom-4 right-4 text-[10px] text-slate-400 bg-black/40 px-2 py-0.5 rounded">
                      zoom 100%
                    </div>
                  </div>
                </div>

                {/* Toolbar */}
                <div className="border-t px-5 py-3 flex flex-wrap items-center gap-3 text-sm">
                  <Button
                    variant={drawMode ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setDrawMode((v) => !v)}
                    disabled={!imageUrl}
                  >
                    ⭕ {drawMode ? "Click image to place…" : "Draw Circle"}
                  </Button>
                  <div className="flex-1" />
                  <span className="text-xs text-muted-foreground">
                    {uploading ? "⏳ Uploading…" : imageUrl ? "💾 Saved" : "No image loaded"}
                  </span>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={focusNoteInput}
                  disabled={!activeImage}
                >
                  + Add note
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {circles.length > 0 && (
                  <div className="space-y-2 pb-3 border-b">
                    <p className="text-xs font-medium text-muted-foreground">
                      Placed annotations ({circles.length})
                    </p>
                    {circles.map((c) => (
                      <div
                        key={c.id}
                        onMouseEnter={() => setHoveredId(c.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className={`rounded-lg border p-3 text-xs flex items-start gap-2 transition-colors ${
                          hoveredId === c.id ? "bg-orange-50 border-orange-300" : "bg-muted/30"
                        }`}
                      >
                        <span className="h-2.5 w-2.5 rounded-full bg-orange-400 mt-1 shrink-0" />
                        <span className="text-muted-foreground">{c.note || "(no note)"}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Saved notes from Supabase */}
                {notesLoading && (
                  <p className="text-xs text-muted-foreground">Loading notes…</p>
                )}

                {!notesLoading && activeImage && notes.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No notes yet for this image.
                  </p>
                )}

                {!activeImage && (
                  <p className="text-xs text-muted-foreground">
                    Select an image to view or add notes.
                  </p>
                )}

                {notes.map((n) => (
                  <div key={n.id} className="rounded-lg border bg-muted/30 p-3 space-y-1 group">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium">{n.author ?? "You"}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(n.created_at)}
                        </span>
                        <button
                          onClick={() => handleDeleteNote(n.id)}
                          className="text-xs text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete note"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {n.body}
                    </p>
                  </div>
                ))}

                {/* Legacy static annotations */}
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
                  ref={noteTextareaRef}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Jot down a thought about this image..."
                  className="min-h-[60px] text-sm resize-none"
                  disabled={!activeImage}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault()
                      saveNote()
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    ⌘/Ctrl + Enter to save
                  </span>
                  <Button
                    size="sm"
                    onClick={saveNote}
                    disabled={!activeImage || !noteDraft.trim()}
                  >
                    Save note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Image queue */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>My Images</CardTitle>
                <CardDescription>From your Supabase bucket</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-72">
                  {imagesLoading && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                      Loading images…
                    </div>
                  )}

                  {imagesError && (
                    <div className="px-4 py-3 text-xs text-destructive">
                      {imagesError}
                    </div>
                  )}

                  {!imagesLoading && !imagesError && images.length === 0 && (
                    <div className="px-4 py-6 text-sm text-muted-foreground text-center">
                      No images yet. Click &quot;Import Images&quot; to upload one.
                    </div>
                  )}

                  {images.map((img) => {
                    const isActive = activeImage?.name === img.name
                    return (
                      <div
                        key={img.name}
                        onClick={() => selectImage(img)}
                        className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 ${
                          isActive ? "bg-blue-50/40 border-l-2 border-l-blue-600" : ""
                        }`}
                      >
                        {/* Thumbnail */}
                        <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-900 shrink-0">
                          <img
                            src={img.url}
                            alt={img.name}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {friendlyName(img.name)}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {formatDate(img.createdAt)}
                          </div>
                        </div>

                        {isActive && (
                          <Badge variant="secondary" className="text-[10px]">
                            Open
                          </Badge>
                        )}
                      </div>
                    )
                  })}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}