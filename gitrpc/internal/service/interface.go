// Copyright 2022 Harness Inc. All rights reserved.
// Use of this source code is governed by the Polyform Free Trial License
// that can be found in the LICENSE.md file for this repository.

package service

import (
	"context"
	"io"

	"github.com/harness/gitness/gitrpc/enum"
	"github.com/harness/gitness/gitrpc/internal/types"
	"github.com/harness/gitness/gitrpc/rpc"
)

// GitAdapter for accessing git commands from gitea.
type GitAdapter interface {
	InitRepository(ctx context.Context, path string, bare bool) error
	Config(ctx context.Context, repoPath, key, value string) error
	SetDefaultBranch(ctx context.Context, repoPath string, defaultBranch string, allowEmpty bool) error
	Clone(ctx context.Context, from, to string, opts types.CloneRepoOptions) error
	AddFiles(repoPath string, all bool, files ...string) error
	Commit(repoPath string, opts types.CommitChangesOptions) error
	Push(ctx context.Context, repoPath string, opts types.PushOptions) error
	ReadTree(ctx context.Context, repoPath, ref string, w io.Writer, args ...string) error
	GetTreeNode(ctx context.Context, repoPath string, ref string, treePath string) (*types.TreeNode, error)
	ListTreeNodes(ctx context.Context, repoPath string, ref string, treePath string,
		recursive bool, includeLatestCommit bool) ([]types.TreeNodeWithCommit, error)
	GetSubmodule(ctx context.Context, repoPath string, ref string, treePath string) (*types.Submodule, error)
	GetBlob(ctx context.Context, repoPath string, sha string, sizeLimit int64) (*types.BlobReader, error)
	WalkReferences(ctx context.Context, repoPath string, handler types.WalkReferencesHandler,
		opts *types.WalkReferencesOptions) error
	GetCommit(ctx context.Context, repoPath string, ref string) (*types.Commit, error)
	GetCommits(ctx context.Context, repoPath string, refs []string) ([]types.Commit, error)
	ListCommits(ctx context.Context, repoPath string,
		ref string, page int, limit int, filter types.CommitFilter) ([]types.Commit, []types.PathRenameDetails, error)
	ListCommitSHAs(ctx context.Context, repoPath string,
		ref string, page int, limit int, filter types.CommitFilter) ([]string, error)
	GetLatestCommit(ctx context.Context, repoPath string, ref string, treePath string) (*types.Commit, error)
	GetFullCommitID(ctx context.Context, repoPath, shortID string) (string, error)
	GetAnnotatedTag(ctx context.Context, repoPath string, sha string) (*types.Tag, error)
	GetAnnotatedTags(ctx context.Context, repoPath string, shas []string) ([]types.Tag, error)
	CreateAnnotatedTag(ctx context.Context, repoPath string, request *rpc.CreateTagRequest, env []string) error
	DeleteTag(ctx context.Context, repoPath string, ref string, env []string) error
	GetBranch(ctx context.Context, repoPath string, branchName string) (*types.Branch, error)
	GetCommitDivergences(ctx context.Context, repoPath string,
		requests []types.CommitDivergenceRequest, max int32) ([]types.CommitDivergence, error)
	GetRef(ctx context.Context, repoPath string, name string, refType enum.RefType) (string, error)
	GetRefPath(refName string, refType enum.RefType) (string, error)
	UpdateRef(ctx context.Context, repoPath, refName string, refType enum.RefType, newValue, oldValue string) error
	CreateTemporaryRepoForPR(ctx context.Context, reposTempPath string, pr *types.PullRequest,
		baseBranch, trackingBranch string) (types.TempRepository, error)
	Merge(ctx context.Context, pr *types.PullRequest, mergeMethod enum.MergeMethod, baseBranch, trackingBranch string,
		tmpBasePath string, mergeMsg string, env []string, identity *types.Identity) error
	GetMergeBase(ctx context.Context, repoPath, remote, base, head string) (string, string, error)
	GetDiffTree(ctx context.Context, repoPath, baseBranch, headBranch string) (string, error)
	RawDiff(ctx context.Context, repoPath, base, head string, w io.Writer, args ...string) error
	DiffShortStat(ctx context.Context, repoPath string,
		baseRef string, headRef string, direct bool) (types.DiffShortStat, error)
	GetDiffHunkHeaders(ctx context.Context, repoPath, targetRef, sourceRef string) ([]*types.DiffFileHunkHeaders, error)
	DiffCut(ctx context.Context, repoPath, targetRef, sourceRef, path string,
		params types.DiffCutParams) (types.HunkHeader, types.Hunk, error)
	Blame(ctx context.Context, repoPath, rev, file string, lineFrom, lineTo int) types.BlameReader
}
