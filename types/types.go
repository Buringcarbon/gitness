// Copyright 2021 Harness Inc. All rights reserved.
// Use of this source code is governed by the Polyform Free Trial License
// that can be found in the LICENSE.md file for this repository.

// Package types defines common data structures.
package types

import (
	"time"

	"github.com/harness/gitness/types/enum"
)

type (
	// Scope defines the data scope.
	Scope struct {
		Account      string
		Organization string
		Project      string
		Redirect     string
	}

	// Params stores query parameters.
	Params struct {
		Page  int        `json:"page"`
		Size  int        `json:"size"`
		Sort  string     `json:"sort"`
		Order enum.Order `json:"direction"`
	}

	// User stores user account details.
	User struct {
		ID       int64  `db:"user_id"        json:"id"`
		Email    string `db:"user_email"     json:"email"`
		Password string `db:"user_password"  json:"-"`
		Salt     string `db:"user_salt"      json:"-"`
		Name     string `db:"user_name"      json:"name"`
		Company  string `db:"user_company"   json:"company"`
		Admin    bool   `db:"user_admin"     json:"admin"`
		Blocked  bool   `db:"user_blocked"   json:"-"`
		Created  int64  `db:"user_created"   json:"created"`
		Updated  int64  `db:"user_updated"   json:"updated"`
		Authed   int64  `db:"user_authed"    json:"authed"`
	}

	// UserInput store user account details used to
	// create or update a user.
	UserInput struct {
		Username *string `json:"email"`
		Password *string `json:"password"`
		Name     *string `json:"name"`
		Company  *string `json:"company"`
		Admin    *bool   `json:"admin"`
	}

	// UserFilter stores user query parameters.
	UserFilter struct {
		Page  int           `json:"page"`
		Size  int           `json:"size"`
		Sort  enum.UserAttr `json:"sort"`
		Order enum.Order    `json:"direction"`
	}

	// Token stores token  details.
	Token struct {
		Value   string    `json:"access_token"`
		Address string    `json:"uri,omitempty"`
		Expires time.Time `json:"expires_at,omitempty"`
	}

	// UserToken stores user account and token details.
	UserToken struct {
		User  *User  `json:"user"`
		Token *Token `json:"token"`
	}
)
