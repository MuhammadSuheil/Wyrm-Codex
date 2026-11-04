import { useState } from 'react'
import Bookmark from './Bookmark'

type Word = { t: string; pos: string; d: string; e: string }
// Core 5e vocabulary a new player meets in their first session
const WORDS: Record<string, Word[]> = {
  Dice: [
    { t: 'Ability Check', pos: 'n.', d: 'A d20 roll plus an ability modifier to see if you succeed at a task.', e: 'Roll a Strength check to force the rusted door.' },
    { t: 'Advantage', pos: 'n.', d: 'Roll two d20s and keep the higher result.', e: 'Attacking a sleeping goblin grants advantage.' },
    { t: 'Disadvantage', pos: 'n.', d: 'Roll two d20s and keep the lower result.', e: 'Shooting a bow in thick fog imposes disadvantage.' },
    { t: 'Difficulty Class', pos: 'n. · DC', d: 'The number you must meet or beat for a check or save to succeed.', e: 'Climbing the slick wall is DC 15.' },
    { t: 'Proficiency Bonus', pos: 'n.', d: 'A bonus added to rolls you are trained in. It grows from +2 to +6 as you level.', e: 'A rogue adds it to Stealth checks.' },
    { t: 'Natural 20', pos: 'n. · nat 20', d: 'Rolling a 20 on the die itself. On an attack, it is a critical hit and damage dice are doubled.', e: 'The table erupts. Roll damage twice.' },
  ],
  Combat: [
    { t: 'Armor Class', pos: 'n. · AC', d: 'How hard you are to hit. An attack must meet or beat it to land.', e: 'Plate armor and a shield give AC 20.' },
    { t: 'Hit Points', pos: 'n. · HP', d: 'Your health. At 0 you fall unconscious and begin making death saves.', e: 'The ogre hits for 13. You drop to 4 HP.' },
    { t: 'Initiative', pos: 'n.', d: 'A Dexterity check rolled when combat starts to set the turn order.', e: 'Everyone roll initiative!' },
    { t: 'Bonus Action', pos: 'n.', d: 'A small extra action certain features grant. You get at most one per turn.', e: 'A rogue uses Cunning Action to Dash as a bonus action.' },
    { t: 'Reaction', pos: 'n.', d: 'An instant response to a trigger, even on another creature\u2019s turn. One per round.', e: 'Cast Shield as a reaction when struck.' },
    { t: 'Opportunity Attack', pos: 'n.', d: 'A free strike against a foe that moves out of your reach.', e: 'The bandit flees and the fighter swings as he goes.' },
  ],
  Magic: [
    { t: 'Cantrip', pos: 'n.', d: 'A level 0 spell you can cast at will, without using a spell slot.', e: 'Fire Bolt can be cast every single turn.' },
    { t: 'Spell Slot', pos: 'n.', d: 'Your reserve of magical energy. Casting a leveled spell spends a slot of that level or higher.', e: 'Fireball burns a 3rd-level slot.' },
    { t: 'Concentration', pos: 'n.', d: 'Some spells last only while you focus on them. Take damage and you must save to keep it.', e: 'Only one concentration spell can be active at a time.' },
    { t: 'Spell Save DC', pos: 'n.', d: 'The number a target must beat to resist your spell: 8 + proficiency + casting modifier.', e: 'The goblin fails its Wisdom save against Hold Person.' },
    { t: 'Ritual', pos: 'n.', d: 'Cast a spell over 10 extra minutes without spending a slot, if it has the ritual tag.', e: 'Detect Magic as a ritual costs only time.' },
    { t: 'Components', pos: 'n. · V, S, M', d: 'What a spell needs: Verbal words, Somatic gestures, Material reagents.', e: 'Gagged and bound, a wizard cannot cast verbal spells.' },
  ],
  Rest: [
    { t: 'Short Rest', pos: 'n.', d: 'At least an hour of downtime. Spend Hit Dice to heal and recover some features.', e: 'A warlock regains spell slots on a short rest.' },
    { t: 'Long Rest', pos: 'n.', d: 'Eight hours of sleep or light activity. Restores HP, spell slots and most abilities.', e: 'Make camp and wake renewed.' },
    { t: 'Hit Dice', pos: 'n.', d: 'A pool of dice equal to your level, spent on short rests to regain HP.', e: 'A fighter rolls a d10 plus Constitution to heal.' },
    { t: 'Exhaustion', pos: 'n.', d: 'A six-level condition from hunger, cold or forced marches. Each level worsens its penalties.', e: 'At level 6, death.' },
    { t: 'Inspiration', pos: 'n.', d: 'A reward from the DM for great roleplay. Spend it to gain advantage on one roll.', e: 'Your heroic speech earns inspiration.' },
    { t: 'Death Saving Throw', pos: 'n.', d: 'At 0 HP, roll a d20 each turn. Three 10s or higher stabilize you. Three failures and you die.', e: 'A natural 20 brings you back with 1 HP.' },
  ],
}
const TABS = Object.keys(WORDS)

export default function Glossary() {
  const [tab, setTab] = useState(TABS[0])
  return (
    <div className="codex-page relative mx-auto max-w-5xl rounded-2xl px-6 py-10 md:px-14 md:py-14">
      <Bookmark />
      <div className="relative flex flex-wrap items-center justify-center gap-2" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`rounded-full border px-5 py-1.5 font-display text-sm tracking-[.25em] transition ${tab === t ? 'border-ember bg-ember/15 text-bone' : 'border-gold/20 text-smoke hover:border-gold/50 hover:text-gold'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>
      <dl key={tab} className="mt-10 grid gap-x-12 gap-y-8 md:grid-cols-2">
        {WORDS[tab].map((w, i) => (
          <div key={w.t} className="rise border-b border-gold/10 pb-6" style={{ animationDelay: `${i * 60}ms` }}>
            <dt className="flex items-baseline gap-3">
              <span className="codex-term font-display text-2xl text-bone">{w.t}</span>
              <span className="text-sm italic text-gold/80">{w.pos}</span>
            </dt>
            <dd className="mt-1.5 text-[17px] leading-relaxed text-bone/80">{w.d}</dd>
            <dd className="mt-2 text-sm italic text-smoke"><span className="not-italic text-ember">e.g.</span> {w.e}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
