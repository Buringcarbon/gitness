// Copyright 2023 Harness, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package sha

import (
	"encoding/json"
	"regexp"
	"strings"

	"github.com/harness/gitness/errors"
)

// EmptyTree is the SHA of an empty tree.
const EmptyTree = "4b825dc642cb6eb9a060e54bf8d69288fbee4904"

var (
	Nil  = Must("0000000000000000000000000000000000000000")
	None = SHA{}
	// regex defines the valid SHA format accepted by GIT (full form and short forms).
	// Note: as of now SHA is at most 40 characters long, but in the future it's moving to sha256
	// which is 64 chars - keep this forward-compatible.
	regex    = regexp.MustCompile("^[0-9a-f]{4,64}$")
	nilRegex = regexp.MustCompile("^0{4,64}$")
)

// SHA represents a git sha.
type SHA struct {
	str string
}

func New(value string) (SHA, error) {
	value = strings.TrimSpace(value)
	value = strings.ToLower(value)
	if !regex.MatchString(value) {
		return SHA{}, errors.InvalidArgument("the provided commit sha '%s' is of invalid format.", value)
	}
	return SHA{
		str: value,
	}, nil
}

func (s *SHA) UnmarshalJSON(content []byte) error {
	if s == nil {
		return nil
	}
	var str string
	err := json.Unmarshal(content, &str)
	if err != nil {
		return err
	}
	sha, err := New(str)
	if err != nil {
		return err
	}
	s.str = sha.str
	return nil
}

func (s SHA) MarshalJSON() ([]byte, error) {
	return []byte("\"" + s.str + "\""), nil
}

// String returns string representation of the SHA.
func (s SHA) String() string {
	return s.str
}

// IsNil returns whether this SHA is all zeroes.
func (s SHA) IsNil() bool {
	return nilRegex.MatchString(s.str)
}

// IsEmpty returns whether this SHA is empty string.
func (s SHA) IsEmpty() bool {
	return s.str == ""
}

// Equal returns true if val has the same SHA.
func (s SHA) Equal(val SHA) bool {
	return s.str == val.str
}

func Must(value string) SHA {
	sha, err := New(value)
	if err != nil {
		panic("invalid SHA" + err.Error())
	}
	return sha
}
