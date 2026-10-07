import { defineTransformersSetup } from '@slidev/types'
import { transformQuotationAnnotations } from './quotations'

export default defineTransformersSetup(() => ({
  pre: [({ s }) => {
    const source = s.toString()
    const transformed = transformQuotationAnnotations(source)
    if (source !== transformed) s.overwrite(0, source.length, transformed)
  }],
}))
