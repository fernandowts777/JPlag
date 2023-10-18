import { defineStore } from 'pinia'
import type { State, SubmissionFile, File, UIState } from './state'
import { MetricType } from '@/model/MetricType'

/**
 * The store is a global state management system. It is used to store the state of the application.
 */
const store = defineStore('store', {
  state: (): { state: State; uiState: UIState } => ({
    state: {
      submissionIdsToComparisonFileName: new Map<string, Map<string, string>>(),
      anonymous: new Set(),
      files: {},
      submissions: {},
      // Mode that was used to load the files
      localModeUsed: false,
      zipModeUsed: false,
      singleModeUsed: false,
      // only used in single mode
      singleFillRawContent: '',
      fileIdToDisplayName: new Map()
    },
    uiState: {
      useDarkMode: false,
      comparisonTableSortingMetric: MetricType.AVERAGE,
      distributionChartConfig: {
        metric: MetricType.AVERAGE,
        xScale: 'linear'
      }
    }
  }),
  getters: {
    /**
     * @param submissionID the name of the submission
     * @returns files in the submission of the given name
     */
    filesOfSubmission:
      (state) =>
      (submissionId: string): SubmissionFile[] => {
        return Array.from(state.state.submissions[submissionId], ([name, value]) => ({
          submissionId,
          fileName: name,
          data: value
        }))
      },
    /**
     * @param name the name of the submission
     * @returns the display name of the submission
     */
    submissionDisplayName: (state) => (id: string) => {
      return state.state.fileIdToDisplayName.get(id)
    },
    /**
     * @returns the Ids of all submissions
     */
    getSubmissionIds(state): Array<string> {
      return Array.from(state.state.fileIdToDisplayName.keys())
    },
    /**
     * @param submissionId1 the id of the first submission
     * @param submissionId2 the id of the second submission
     * @returns the name of the comparison file between the two submissions
     */
    getComparisonFileName: (state) => (submissionId1: string, submissionId2: string) => {
      return state.state.submissionIdsToComparisonFileName.get(submissionId1)?.get(submissionId2)
    },
    /**
     * @param submissionId1 the id of the first submission
     * @param submissionId2 the id of the second submission
     * @returns the comparison file between the two submissions
     */
    getComparisonFileForSubmissions() {
      return (submissionId1: string, submissionId2: string) => {
        const expectedFileName = this.getComparisonFileName(submissionId1, submissionId2)
        const index = expectedFileName
          ? Object.keys(this.state.files).find((name) => name.endsWith(expectedFileName))
          : undefined
        return index != undefined ? this.state.files[index] : undefined
      }
    }
  },
  actions: {
    /**
     * Clears the store
     */
    clearStore() {
      this.state = {
        submissionIdsToComparisonFileName: new Map<string, Map<string, string>>(),
        anonymous: new Set(),
        files: {},
        submissions: {},
        localModeUsed: false,
        zipModeUsed: false,
        singleModeUsed: false,
        singleFillRawContent: '',
        fileIdToDisplayName: new Map()
      }
    },
    /**
     * Adds the given ids to the set of anonymous submissions
     * @param id the id of the submission to hide
     */
    addAnonymous(id: string[]) {
      for (let i = 0; i < id.length; i++) {
        this.state.anonymous.add(id[i])
      }
    },
    /**
     * Removes the given ids from the set of anonymous submissions
     * @param id the id of the submission to show
     */
    removeAnonymous(id: string[]) {
      for (let i = 0; i < id.length; i++) {
        this.state.anonymous.delete(id[i])
      }
    },
    /**
     * Clears the set of anonymous submissions
     */
    resetAnonymous() {
      this.state.anonymous = new Set()
    },
    /**
     * Sets the map of submission ids to comparison file names
     * @param map the map to set
     */
    saveComparisonFileLookup(map: Map<string, Map<string, string>>) {
      this.state.submissionIdsToComparisonFileName = map
    },
    /**
     * Saves the given file
     * @param file the file to save
     */
    saveFile(file: File) {
      this.state.files[file.fileName] = file.data
    },
    /**
     * Saves the given submission names
     * @param names the names to save
     */
    saveSubmissionNames(names: Map<string, string>) {
      this.state.fileIdToDisplayName = names
    },
    /**
     * Saves the given submission file
     * @param submissionFile the file to save
     */
    saveSubmissionFile(submissionFile: SubmissionFile) {
      if (!this.state.submissions[submissionFile.submissionId]) {
        this.state.submissions[submissionFile.submissionId] = new Map()
      }
      this.state.submissions[submissionFile.submissionId].set(
        submissionFile.fileName,
        submissionFile.data
      )
    },
    /**
     * Sets the loading type
     * @param payload Type used to input JPlag results
     */
    setLoadingType(loadingType: 'zip' | 'local' | 'single') {
      this.state.localModeUsed = loadingType == 'local'
      this.state.zipModeUsed = loadingType == 'zip'
      this.state.singleModeUsed = loadingType == 'single'
    },
    /**
     * Sets the raw content of the single file mode
     * @param payload Raw content of the single file mode
     */
    setSingleFileRawContent(payload: string) {
      this.state.singleFillRawContent = payload
    },
    /**
     * Switches whether darkMode is being used for the UI
     */
    changeUseDarkMode() {
      this.uiState.useDarkMode = !this.uiState.useDarkMode
    }
  }
})

export { store }
