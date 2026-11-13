import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useData } from '../ui/data'
import { Card, cx, Section } from '../ui/kit'
import { PageHead } from '../ui/shared'

const DECOUVERTE = ['Quel véhicule recherchez-vous ?', 'Pour quel usage ? (trajets, famille, professionnel, km par an)', 'Quel budget souhaitez-vous respecter ?', 'Avez-vous un véhicule à reprendre ?', 'Souhaitez-vous un financement ?', 'Quelles caractéristiques sont indispensables ?', 'Quels modèles avez-vous déjà envisagés ?', 'Dans quel délai souhaitez-vous acheter ?']
const ESSAI = ['Proposer l’essai dès que le besoin est qualifié, sans attendre un signal d’achat fort.', 'Après l’essai, demander : « Qu’est-ce qui vous ferait hésiter ? » avant « Qu’est-ce qui vous a plu ? ».', 'Noter le modèle essayé, les impressions et les hésitations dans la fiche (Noter → Essai).', 'Conclure l’essai par une étape datée : devis, second essai, vérification de reprise.']
const CONCLUSION = ['Nouvel essai (autre version, avec le conjoint)', 'Devis actualisé', 'Vérification / nouvelle estimation de la reprise', 'Question précise à clarifier, avec une date de réponse', 'Rendez-vous en concession', 'Relance datée, convenue avec le client']

export default function AideVente() {
  const { settings: s } = useData()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div>
      <PageHead title="Aide à la vente" sub="Repères personnels — votre jugement commercial reste le pilote" back="/plus" />
      <Section title="Découverte client">
        <Card className="divide-y divide-line">{DECOUVERTE.map((q, i) => <p key={q} className={cx('px-4 py-2.5 text-sm', i === 1 && 'bg-accent-soft font-semibold text-accent')}>{i + 1}. {q}{i === 1 && ' — à ne pas oublier'}</p>)}</Card>
        <p className="mt-1.5 px-1 text-xs text-muted">La fiche de chaque prospect (onglet Découverte) indique les questions encore sans réponse.</p>
      </Section>
      <Section title="Essais">
        <Card className="divide-y divide-line">{ESSAI.map((q) => <p key={q} className="px-4 py-2.5 text-sm">{q}</p>)}</Card>
      </Section>
      <Section title="Objections">
        <div className="space-y-2">
          {s.objections.map((o) => (
            <Card key={o.id}>
              <button type="button" className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left" aria-expanded={open === o.id} onClick={() => setOpen(open === o.id ? null : o.id)}>
                <span><span className="block text-xs font-bold uppercase tracking-wide text-accent">{o.theme}</span><span className="text-sm font-semibold">{o.question}</span></span>
                <ChevronDown size={18} className={cx('shrink-0 text-muted transition', open === o.id && 'rotate-180')} />
              </button>
              {open === o.id && <p className="border-t border-line px-4 py-3 text-sm">{o.reponse}</p>}
            </Card>
          ))}
        </div>
        <p className="mt-1.5 px-1 text-xs text-muted">Réponses modifiables dans Paramètres. N’y inscrivez que des arguments vérifiables : aucune garantie, remise ou caractéristique ne doit être inventée.</p>
      </Section>
      <Section title="Quand le client hésite : proposer une étape concrète">
        <Card className="divide-y divide-line">{CONCLUSION.map((q) => <p key={q} className="px-4 py-2.5 text-sm">{q}</p>)}</Card>
      </Section>
    </div>
  )
}
