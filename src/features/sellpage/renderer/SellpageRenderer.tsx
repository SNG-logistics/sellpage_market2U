// The `/rsc` entry is Puck's pure-render build: same output as the default
// entry's `Render`, but without the editor's state store or rich-text-editing
// chunks, so the public page never loads the Puck Editor bundle.
import { Render } from '@puckeditor/core/rsc'
import { puckConfig } from '../blocks'
import type { SellpageData } from '../schemas/sellpageSchema'

type Props = { data: SellpageData }

/**
 * The ONE renderer used by both the admin preview and the public page.
 * Both consume `puckConfig`, so a block can never drift between contexts.
 */
export function SellpageRenderer({ data }: Props) {
  return <Render config={puckConfig} data={data} />
}
