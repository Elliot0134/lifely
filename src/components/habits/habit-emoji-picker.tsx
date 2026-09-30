'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface HabitEmojiPickerProps {
  value: string | undefined
  onChange: (emoji: string) => void
  className?: string
}

// ─── Curated emojis ─────────────────────────────────────────
// Categories with labels for search. Labels en français + anglais (substring match).

interface EmojiEntry {
  emoji: string
  label: string
}

interface EmojiCategory {
  name: string
  emojis: EmojiEntry[]
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: 'Sport & Fitness',
    emojis: [
      { emoji: '💪', label: 'muscle force sport fitness muscu' },
      { emoji: '🏋️', label: 'haltere muscu gym fitness' },
      { emoji: '🏃', label: 'course running run jogging cardio' },
      { emoji: '🚴', label: 'velo bike cycling cyclisme' },
      { emoji: '🧘', label: 'yoga meditation zen' },
      { emoji: '⚽', label: 'foot football soccer sport' },
      { emoji: '🏊', label: 'nage natation swim piscine' },
      { emoji: '🤸', label: 'gym gymnastique stretching etirement' },
    ],
  },
  {
    name: 'Alimentation',
    emojis: [
      { emoji: '🥗', label: 'salade salad food healthy sain' },
      { emoji: '🍎', label: 'pomme apple fruit food' },
      { emoji: '🥦', label: 'brocoli broccoli legume vegetable' },
      { emoji: '🥤', label: 'boisson drink jus juice' },
      { emoji: '💧', label: 'eau water hydratation' },
      { emoji: '🍵', label: 'the tea infusion' },
      { emoji: '🥛', label: 'lait milk' },
    ],
  },
  {
    name: 'Esprit & Bien-être',
    emojis: [
      { emoji: '🧠', label: 'cerveau brain mental esprit' },
      { emoji: '📖', label: 'livre book lecture reading' },
      { emoji: '📚', label: 'livres books study etudes apprentissage' },
      { emoji: '✍️', label: 'ecriture writing journal note' },
      { emoji: '🎨', label: 'art peinture creativite creative' },
      { emoji: '🎵', label: 'musique music son audio' },
      { emoji: '🧘‍♂️', label: 'meditation yoga mindfulness zen' },
    ],
  },
  {
    name: 'Sommeil & Repos',
    emojis: [
      { emoji: '😴', label: 'dormir sleep sommeil' },
      { emoji: '🌙', label: 'lune moon nuit night' },
      { emoji: '☀️', label: 'soleil sun matin morning reveil' },
      { emoji: '🛌', label: 'lit bed coucher sleep' },
    ],
  },
  {
    name: 'Productivité',
    emojis: [
      { emoji: '💻', label: 'ordinateur computer code work travail' },
      { emoji: '📱', label: 'telephone phone mobile' },
      { emoji: '📵', label: 'no phone deconnexion digital detox' },
      { emoji: '⏰', label: 'alarme clock heure time reveil' },
      { emoji: '✅', label: 'check valider done fait' },
      { emoji: '🎯', label: 'cible target objectif goal' },
      { emoji: '🔥', label: 'feu fire streak motivation flamme' },
    ],
  },
  {
    name: 'Social',
    emojis: [
      { emoji: '👥', label: 'amis friends social personnes' },
      { emoji: '💬', label: 'discussion chat message conversation' },
      { emoji: '📞', label: 'appel call phone telephone' },
      { emoji: '☕', label: 'cafe coffee pause' },
    ],
  },
  {
    name: 'Divers',
    emojis: [
      { emoji: '⭐', label: 'etoile star favori favorite' },
      { emoji: '✨', label: 'etincelle sparkle magic magique' },
      { emoji: '🌱', label: 'pousse plant croissance growth nature' },
      { emoji: '💎', label: 'diamant diamond valeur premium' },
    ],
  },
]

// ─── Component ──────────────────────────────────────────────

export function HabitEmojiPicker({
  value,
  onChange,
  className,
}: HabitEmojiPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return EMOJI_CATEGORIES
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter(
        (e) => e.label.includes(q) || e.emoji.includes(q),
      ),
    })).filter((cat) => cat.emojis.length > 0)
  }, [query])

  const handleSelect = (emoji: string) => {
    onChange(emoji)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={value ? `Emoji sélectionné : ${value}` : 'Choisir un emoji'}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-md border border-input bg-background text-2xl transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
            className,
          )}
        >
          {value ? (
            <span>{value}</span>
          ) : (
            <span className="opacity-40">😀</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        <div className="relative mb-2">
          <Search
            size={14}
            aria-hidden="true"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un emoji..."
            className="h-8 pl-7 text-sm"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto pr-1">
          {filteredCategories.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              Aucun emoji trouvé
            </p>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.name} className="mb-3 last:mb-0">
                <h4 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {category.name}
                </h4>
                <div className="grid grid-cols-8 gap-1">
                  {category.emojis.map(({ emoji, label }) => (
                    <button
                      key={emoji}
                      type="button"
                      aria-label={`Sélectionner ${label}`}
                      onClick={() => handleSelect(emoji)}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-md p-1 text-xl transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
                        value === emoji && 'bg-accent ring-2 ring-ring',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
