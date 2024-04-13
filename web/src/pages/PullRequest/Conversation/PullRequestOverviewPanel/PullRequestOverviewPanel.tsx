import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Container, Layout, useIsMounted, useToaster } from '@harnessio/uicore'
import cx from 'classnames'
import { useGet, useMutate } from 'restful-react'
import type {
  TypesCodeOwnerEvaluation,
  TypesPullReq,
  TypesPullReqReviewer,
  TypesRepository,
  TypesRuleViolations
} from 'services/code'
import { PanelSectionOutletPosition } from 'pages/PullRequest/PullRequestUtils'
import { MergeCheckStatus, PRMergeOption, dryMerge } from 'utils/Utils'
import { PullRequestState } from 'utils/GitUtils'
import { useStrings } from 'framework/strings'
import type { PRChecksDecisionResult } from 'hooks/usePRChecksDecision'
import { useGetRepositoryMetadata } from 'hooks/useGetRepositoryMetadata'
import { PullRequestActionsBox } from '../PullRequestActionsBox/PullRequestActionsBox'
import PullRequestPanelSections from './PullRequestPanelSections'
import ChecksSection from './sections/ChecksSection'
import MergeSection from './sections/MergeSection'
import CommentsSection from './sections/CommentsSection'
import ChangesSection from './sections/ChangesSection'
import css from './PullRequestOverviewPanel.module.scss'
interface PullRequestOverviewPanelProps {
  repoMetadata: TypesRepository
  pullReqMetadata: TypesPullReq
  onPRStateChanged: () => void
  refetchReviewers: () => void
  prChecksDecisionResult: PRChecksDecisionResult
  codeOwners: TypesCodeOwnerEvaluation | null
  reviewers: TypesPullReqReviewer[] | null
}

const PullRequestOverviewPanel = (props: PullRequestOverviewPanelProps) => {
  const { codeOwners, repoMetadata, pullReqMetadata, onPRStateChanged, refetchReviewers, reviewers } = props
  const { getString } = useStrings()
  const { showError } = useToaster()

  const isMounted = useIsMounted()
  const isClosed = pullReqMetadata.state === PullRequestState.CLOSED

  const unchecked = useMemo(
    () => pullReqMetadata.merge_check_status === MergeCheckStatus.UNCHECKED && !isClosed,
    [pullReqMetadata, isClosed]
  )
  const [ruleViolation, setRuleViolation] = useState(false)
  const [ruleViolationArr, setRuleViolationArr] = useState<{ data: { rule_violations: TypesRuleViolations[] } }>()
  const [requiresCommentApproval, setRequiresCommentApproval] = useState(false)
  const [atLeastOneReviewerRule, setAtLeastOneReviewerRule] = useState(false)
  const [reqCodeOwnerApproval, setReqCodeOwnerApproval] = useState(false)
  const [minApproval, setMinApproval] = useState(0)
  const [reqCodeOwnerLatestApproval, setReqCodeOwnerLatestApproval] = useState(false)
  const [minReqLatestApproval, setMinReqLatestApproval] = useState(0)
  const [resolvedCommentArr, setResolvedCommentArr] = useState<any>()
  const { pullRequestSection } = useGetRepositoryMetadata()
  const mergeable = useMemo(() => pullReqMetadata.merge_check_status === MergeCheckStatus.MERGEABLE, [pullReqMetadata])
  const mergeOptions: PRMergeOption[] = [
    {
      method: 'squash',
      title: getString('pr.mergeOptions.squashAndMerge'),
      desc: getString('pr.mergeOptions.squashAndMergeDesc'),
      disabled: mergeable === false,
      label: getString('pr.mergeOptions.squashAndMerge'),
      value: 'squash'
    },
    {
      method: 'merge',
      title: getString('pr.mergeOptions.createMergeCommit'),
      desc: getString('pr.mergeOptions.createMergeCommitDesc'),
      disabled: mergeable === false,
      label: getString('pr.mergeOptions.createMergeCommit'),
      value: 'merge'
    },
    {
      method: 'rebase',
      title: getString('pr.mergeOptions.rebaseAndMerge'),
      desc: getString('pr.mergeOptions.rebaseAndMergeDesc'),
      disabled: mergeable === false,
      label: getString('pr.mergeOptions.rebaseAndMerge'),
      value: 'rebase'
    },

    {
      method: 'close',
      title: getString('pr.mergeOptions.close'),
      desc: getString('pr.mergeOptions.closeDesc'),
      label: getString('pr.mergeOptions.close'),
      value: 'close'
    }
  ]
  const [allowedStrats, setAllowedStrats] = useState<string[]>([
    mergeOptions[0].method,
    mergeOptions[1].method,
    mergeOptions[2].method,
    mergeOptions[3].method
  ])
  const { mutate: mergePR } = useMutate({
    verb: 'POST',
    path: `/api/v1/repos/${repoMetadata.path}/+/pullreq/${pullReqMetadata.number}/merge`
  })
  const { data: data } = useGet({
    path: `/api/v1/repos/${repoMetadata.path}/+/rules`
  })
  // Flags to optimize rendering
  const internalFlags = useRef({ dryRun: false })

  function extractSpecificViolations(violationsData: any, rule: string) {
    const specificViolations = violationsData?.data?.rule_violations.flatMap((violation: { violations: any[] }) =>
      violation.violations.filter(v => v.code === rule)
    )
    return specificViolations
  }

  useEffect(() => {
    if (ruleViolationArr) {
      const requireResCommentRule = extractSpecificViolations(ruleViolationArr, 'pullreq.comments.require_resolve_all')
      if (requireResCommentRule) {
        setResolvedCommentArr(requireResCommentRule[0])
      }
    }
  }, [ruleViolationArr, pullReqMetadata, repoMetadata, data, ruleViolation])
  useEffect(() => {
    // recheck PR in case source SHA changed or PR was marked as unchecked
    // TODO: optimize call to handle all causes and avoid double calls by keeping track of SHA
    dryMerge(
      isMounted,
      isClosed,
      pullReqMetadata,
      internalFlags,
      mergePR,
      setRuleViolation,
      setRuleViolationArr,
      setAllowedStrats,
      pullRequestSection,
      showError,
      setRequiresCommentApproval,
      setAtLeastOneReviewerRule,
      setReqCodeOwnerApproval,
      setMinApproval,
      setReqCodeOwnerLatestApproval,
      setMinReqLatestApproval
    ) // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unchecked, pullReqMetadata?.source_sha])

  return (
    <Container margin={{ bottom: 'medium' }} className={css.mainContainer}>
      <Layout.Vertical>
        <PullRequestActionsBox
          repoMetadata={repoMetadata}
          pullReqMetadata={pullReqMetadata}
          onPRStateChanged={onPRStateChanged}
          refetchReviewers={refetchReviewers}
          allowedStrategy={allowedStrats}
        />

        <PullRequestPanelSections
          outlets={{
            [PanelSectionOutletPosition.CHANGES]: (
              <ChangesSection
                pullReqMetadata={pullReqMetadata}
                repoMetadata={repoMetadata}
                codeOwners={codeOwners}
                atLeastOneReviewerRule={atLeastOneReviewerRule}
                reqCodeOwnerApproval={reqCodeOwnerApproval}
                minApproval={minApproval}
                reviewers={reviewers}
                minReqLatestApproval={minReqLatestApproval}
                reqCodeOwnerLatestApproval={reqCodeOwnerLatestApproval}
              />
            ),
            [PanelSectionOutletPosition.COMMENTS]: (!!resolvedCommentArr || requiresCommentApproval) && (
              <Container className={cx(css.sectionContainer, css.borderContainer)}>
                <CommentsSection
                  pullReqMetadata={pullReqMetadata}
                  repoMetadata={repoMetadata}
                  resolvedCommentArr={resolvedCommentArr}
                  requiresCommentApproval={requiresCommentApproval}
                />
              </Container>
            ),
            [PanelSectionOutletPosition.CHECKS]: (
              <ChecksSection pullReqMetadata={pullReqMetadata} repoMetadata={repoMetadata} />
            ),
            [PanelSectionOutletPosition.MERGEABILITY]: (
              <Container className={cx(css.sectionContainer, css.borderRadius)}>
                <MergeSection unchecked={unchecked} mergeable={mergeable} />
              </Container>
            )
          }}
        />
      </Layout.Vertical>
    </Container>
  )
}

export default PullRequestOverviewPanel
