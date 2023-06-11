import { Comparison } from '../Comparison'
import type { Match } from '../Match'
import type { SubmissionFile } from '../SubmissionFile'
import type { MatchInSingleFile } from '../MatchInSingleFile'
import store from '@/stores/store'
import { generateHuesForInterval, toHSLAArray } from '@/utils/ColorUtils'

/**
 * Factory class for creating Comparison objects
 */
export class ComparisonFactory {
  /**
   * Creates a comparison object from a json object created by by JPlag
   * @param json the json object
   */
  static getComparison(json: Record<string, unknown>): Comparison {
    const filesOfFirstSubmission = store().filesOfSubmission(json.id1 as string)
    const filesOfSecondSubmission = store().filesOfSubmission(json.id2 as string)

    const filesOfFirstConverted = this.convertToFilesByName(filesOfFirstSubmission)
    const filesOfSecondConverted = this.convertToFilesByName(filesOfSecondSubmission)

    const matches = json.matches as Array<Record<string, unknown>>

    const colors = this.generateColorsForMatches(matches.length)
    const coloredMatches = matches.map((match, index) => this.mapMatch(match, colors[index]))

    const matchesInFirst = this.groupMatchesByFileName(coloredMatches, 1)
    const matchesInSecond = this.groupMatchesByFileName(coloredMatches, 2)

    const comparison = new Comparison(
      json.id1 as string,
      json.id2 as string,
      json.similarity as number
    )
    comparison.filesOfFirstSubmission = filesOfFirstConverted
    comparison.filesOfSecondSubmission = filesOfSecondConverted
    comparison.colors = colors
    comparison.allMatches = coloredMatches
    comparison.matchesInFirstSubmission = matchesInFirst
    comparison.matchesInSecondSubmissions = matchesInSecond

    return comparison
  }

  private static convertToFilesByName(
    files: Array<{ name: string; value: string }>
  ): Map<string, SubmissionFile> {
    const map = new Map<string, SubmissionFile>()
    files.forEach((val) => {
      if (!map.get(val.name)) {
        map.set(val.name as string, {
          lines: [],
          collapsed: false
        })
      }
      map.set(val.name as string, {
        lines: val.value.split(/\r?\n/),
        collapsed: false
      })
    })
    return map
  }

  private static groupMatchesByFileName(
    matches: Array<Match>,
    index: number
  ): Map<string, Array<MatchInSingleFile>> {
    const acc = new Map<string, Array<MatchInSingleFile>>()
    matches.forEach((val) => {
      const name = index === 1 ? (val.firstFile as string) : (val.secondFile as string)

      if (!acc.get(name)) {
        acc.set(name, [])
      }

      if (index === 1) {
        const newVal: MatchInSingleFile = {
          start: val.startInFirst as number,
          end: val.endInFirst as number,
          linked_panel: 2,
          linked_file: val.secondFile as string,
          linked_line: val.startInSecond as number,
          color: val.color as string
        }
        acc.get(name)?.push(newVal)
      } else {
        const newVal: MatchInSingleFile = {
          start: val.startInSecond as number,
          end: val.endInSecond as number,
          linked_panel: 1,
          linked_file: val.firstFile as string,
          linked_line: val.startInFirst as number,
          color: val.color as string
        }
        acc.get(name)?.push(newVal)
      }
    })
    return acc
  }

  private static generateColorsForMatches(num: number): Array<string> {
    const numberOfColorsInFirstInterval = Math.round(((80 - 20) / (80 - 20 + (340 - 160))) * num) // number of colors from the first interval
    const numberOfColorsInSecondInterval = num - numberOfColorsInFirstInterval // number of colors from the second interval

    const hues: Array<number> = generateHuesForInterval(20, 80, numberOfColorsInFirstInterval)
    hues.push(...generateHuesForInterval(160, 340, numberOfColorsInSecondInterval))
    return toHSLAArray(hues, 0.8, 0.5, 0.3)
  }

  private static mapMatch(match: Record<string, unknown>, color: string): Match {
    return {
      firstFile: match.file1 as string,
      secondFile: match.file2 as string,
      startInFirst: match.start1 as number,
      endInFirst: match.end1 as number,
      startInSecond: match.start2 as number,
      endInSecond: match.end2 as number,
      tokens: match.tokens as number,
      color: color
    }
  }
}
