#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCS_DIR="$PROJECT_ROOT/docs"

# ── Claude Code docs ─────────────────────────────────────────────────
CC_BASE="https://code.claude.com/docs/en"
CC_DIR="$DOCS_DIR/claude-code"

CC_SLUGS=(
  agent-teams
  amazon-bedrock
  analytics
  authentication
  best-practices
  changelog
  checkpointing
  chrome
  claude-code-on-the-web
  cli-reference
  common-workflows
  costs
  data-usage
  desktop-quickstart
  desktop
  devcontainer
  discover-plugins
  fast-mode
  features-overview
  github-actions
  gitlab-ci-cd
  google-vertex-ai
  headless
  hooks-guide
  hooks
  how-claude-code-works
  interactive-mode
  jetbrains
  keybindings
  legal-and-compliance
  llm-gateway
  mcp
  memory
  microsoft-foundry
  model-config
  monitoring-usage
  network-config
  output-styles
  overview
  permissions
  plugin-marketplaces
  plugins-reference
  plugins
  quickstart
  sandboxing
  security
  server-managed-settings
  settings
  setup
  skills
  slack
  statusline
  sub-agents
  terminal-config
  third-party-integrations
  troubleshooting
  vs-code
)

mkdir -p "$CC_DIR"

echo "==> Syncing Claude Code docs (${#CC_SLUGS[@]} pages + llms.txt)..."

cc_ok=0
cc_fail=0

# llms.txt first
if curl -sfL "https://code.claude.com/llms.txt" -o "$CC_DIR/llms.txt"; then
  ((cc_ok++))
else
  echo "  FAIL: llms.txt"
  ((cc_fail++))
fi

for slug in "${CC_SLUGS[@]}"; do
  if curl -sfL "$CC_BASE/${slug}.md" -o "$CC_DIR/${slug}.md"; then
    ((cc_ok++))
  else
    echo "  FAIL: ${slug}.md"
    ((cc_fail++))
  fi
done

echo "  Done: ${cc_ok} ok, ${cc_fail} failed"

# ── Codex docs ────────────────────────────────────────────────────────
CX_BASE="https://developers.openai.com/codex"
CX_DIR="$DOCS_DIR/codex"

# Flat paths (no subdirectory)
CX_FLAT=(
  app-server
  app
  auth
  cli
  cloud
  config-advanced
  config-basic
  config-reference
  config-sample
  custom-prompts
  explore
  feature-maturity
  github-action
  ide
  mcp
  models
  multi-agent
  noninteractive
  open-source
  overview
  pricing
  prompting
  quickstart
  rules
  sdk
  security
  skills
  videos
  windows
  workflows
)

# Nested paths (subdirectory/file)
CX_NESTED=(
  app/automations
  app/commands
  app/features
  app/local-environments
  app/review
  app/settings
  app/troubleshooting
  app/worktrees
  cli/features
  cli/reference
  cli/slash-commands
  cloud/environments
  cloud/internet-access
  concepts/customization
  concepts/cyber-safety
  concepts/multi-agents
  enterprise/admin-setup
  enterprise/governance
  guides/agents-md
  guides/agents-sdk
  guides/build-ai-native-engineering-team
  ide/commands
  ide/features
  ide/settings
  ide/slash-commands
  integrations/github
  integrations/linear
  integrations/slack
)

CX_TOTAL=$(( ${#CX_FLAT[@]} + ${#CX_NESTED[@]} ))

echo "==> Syncing Codex docs (${CX_TOTAL} pages + llms.txt)..."

cx_ok=0
cx_fail=0

# llms.txt first
if curl -sfL "$CX_BASE/llms.txt" -o "$CX_DIR/llms.txt"; then
  ((cx_ok++))
else
  echo "  FAIL: llms.txt"
  ((cx_fail++))
fi

for slug in "${CX_FLAT[@]}"; do
  if curl -sfL "$CX_BASE/${slug}.md" -o "$CX_DIR/${slug}.md"; then
    ((cx_ok++))
  else
    echo "  FAIL: ${slug}.md"
    ((cx_fail++))
  fi
done

for path in "${CX_NESTED[@]}"; do
  mkdir -p "$CX_DIR/$(dirname "$path")"
  if curl -sfL "$CX_BASE/${path}.md" -o "$CX_DIR/${path}.md"; then
    ((cx_ok++))
  else
    echo "  FAIL: ${path}.md"
    ((cx_fail++))
  fi
done

echo "  Done: ${cx_ok} ok, ${cx_fail} failed"

# ── Cursor docs ──────────────────────────────────────────────────────
CR_BASE="https://cursor.com"
CR_DIR="$DOCS_DIR/cursor"

CR_PAGES=(
  docs/get-started/quickstart
  docs/get-started/concepts
  docs/models
  docs/downloads
  docs/account/billing
  docs/account/pricing
  docs/account/regions
  docs/account/update-access
  docs/account/teams/setup
  docs/account/teams/members
  docs/account/teams/dashboard
  docs/account/teams/admin-api
  docs/account/teams/analytics
  docs/account/teams/analytics-api
  docs/account/teams/sso
  docs/account/teams/scim
  docs/account/teams/pricing
  docs/account/billing/spend-limits
  docs/account/billing/spend-alerts
  docs/account/enterprise/billing-groups
  docs/account/enterprise/service-accounts
  docs/configuration/extensions
  docs/configuration/kbd
  docs/configuration/languages/python
  docs/configuration/languages/javascript-typescript
  docs/configuration/languages/java
  docs/configuration/languages/ios-macos-swift
  docs/configuration/migrations/vscode
  docs/configuration/migrations/jetbrains
  docs/configuration/shell
  docs/configuration/themes
  docs/configuration/worktrees
  docs/context/commands
  docs/context/mentions
  docs/context/rules
  docs/context/skills
  docs/context/max-mode
  docs/context/semantic-search
  docs/context/ignore-files
  docs/context/subagents
  docs/context/mcp
  docs/context/mcp-extension-api
  docs/context/mcp/directory
  docs/context/mcp/install-links
  docs/cli/overview
  docs/cli/installation
  docs/cli/using
  docs/cli/headless
  docs/cli/shell-mode
  docs/cli/mcp
  docs/cli/github-actions
  docs/cli/reference/authentication
  docs/cli/reference/configuration
  docs/cli/reference/parameters
  docs/cli/reference/permissions
  docs/cli/reference/output-format
  docs/cli/reference/terminal-setup
  docs/cli/reference/slash-commands
  docs/cli/cookbook/code-review
  docs/cli/cookbook/fix-ci
  docs/cli/cookbook/secret-audit
  docs/cli/cookbook/translate-keys
  docs/cli/cookbook/update-docs
  docs/agent/overview
  docs/agent/modes
  docs/agent/browser
  docs/agent/hooks
  docs/agent/terminal
  docs/agent/review
  docs/agent/security
  docs/agent/third-party-hooks
  docs/cloud-agent
  docs/cloud-agent/egress-ip-ranges
  docs/cloud-agent/web-and-mobile
  docs/cloud-agent/api/endpoints
  docs/cloud-agent/api/webhooks
  docs/api
  docs/settings/api-keys
  docs/settings/aws-bedrock
  docs/bugbot
  docs/january
  docs/plugins
  docs/plugins/building
  docs/plugins/security
  docs/reuse-existing-code
  docs/shared-transcripts
  docs/integrations/git
  docs/integrations/github
  docs/integrations/gitlab
  docs/integrations/linear
  docs/integrations/slack
  docs/integrations/cursor-blame
  docs/integrations/deeplinks
  docs/inline-edit/overview
  docs/inline-edit/terminal
  docs/tab/overview
  docs/troubleshooting/common-issues
  docs/troubleshooting/troubleshooting-guide
  docs/troubleshooting/request-reporting
  docs/enterprise
  docs/enterprise/deployment-patterns
  docs/enterprise/identity-and-access-management
  docs/enterprise/llm-safety-and-controls
  docs/enterprise/model-and-integration-management
  docs/enterprise/network-configuration
  docs/enterprise/privacy-and-data-governance
  docs/enterprise/compliance-and-monitoring
  docs/cookbook/agent-workflows
  docs/cookbook/bugbot-rules
  docs/cookbook/building-mcp-server
  docs/cookbook/data-science
  docs/cookbook/large-codebases
  docs/cookbook/mermaid-diagrams
  docs/cookbook/web-development
)

echo "==> Syncing Cursor docs (${#CR_PAGES[@]} pages via r.jina.ai)..."

cr_ok=0
cr_fail=0

for page in "${CR_PAGES[@]}"; do
  # Strip leading "docs/" to build the output path
  rel="${page#docs/}"
  mkdir -p "$CR_DIR/$(dirname "$rel")"

  if curl -sfL "https://r.jina.ai/${CR_BASE}/${page}" -o "$CR_DIR/${rel}.md"; then
    ((cr_ok++))
  else
    echo "  FAIL: ${rel}"
    ((cr_fail++))
  fi
  sleep 4  # r.jina.ai free tier rate limit (~20 RPM)
done

echo "  Done: ${cr_ok} ok, ${cr_fail} failed"

# ── OpenCode docs ────────────────────────────────────────────────────
OC_RAW="https://raw.githubusercontent.com/anomalyco/opencode/dev/packages/web/src/content/docs"
OC_DIR="$DOCS_DIR/opencode"

OC_PAGES=(
  index
  acp
  agents
  cli
  commands
  config
  custom-tools
  ecosystem
  enterprise
  formatters
  github
  gitlab
  ide
  keybinds
  lsp
  mcp-servers
  models
  modes
  network
  permissions
  plugins
  providers
  rules
  sdk
  server
  share
  skills
  themes
  tools
  troubleshooting
  tui
  web
  windows-wsl
  zen
)

mkdir -p "$OC_DIR"

echo "==> Syncing OpenCode docs (${#OC_PAGES[@]} pages from GitHub raw)..."

oc_ok=0
oc_fail=0

for slug in "${OC_PAGES[@]}"; do
  if curl -sfL "$OC_RAW/${slug}.mdx" -o "$OC_DIR/${slug}.mdx"; then
    ((oc_ok++))
  else
    echo "  FAIL: ${slug}.mdx"
    ((oc_fail++))
  fi
done

echo "  Done: ${oc_ok} ok, ${oc_fail} failed"

# ── Copilot docs ──────────────────────────────────────────────────────
CP_RAW="https://raw.githubusercontent.com/github/docs/main/content/copilot"
CP_DIR="$DOCS_DIR/copilot"

CP_PAGES=(
  concepts/about-enterprise-accounts-for-copilot-business
  concepts/agents/about-agent-skills
  concepts/agents/about-third-party-agents
  concepts/agents/anthropic-claude
  concepts/agents/code-review
  concepts/agents/coding-agent/about-coding-agent
  concepts/agents/coding-agent/about-custom-agents
  concepts/agents/coding-agent/about-hooks
  concepts/agents/coding-agent/access-management
  concepts/agents/coding-agent/agent-management
  concepts/agents/coding-agent/mcp-and-coding-agent
  concepts/agents/copilot-cli/about-cli-plugins
  concepts/agents/copilot-cli/about-copilot-cli
  concepts/agents/copilot-cli/comparing-cli-features
  concepts/agents/copilot-memory
  concepts/agents/enterprise-management
  concepts/agents/openai-codex
  concepts/auto-model-selection
  concepts/billing/billing-for-individuals
  concepts/billing/copilot-requests
  concepts/billing/individual-plans
  concepts/billing/organizations-and-enterprises
  concepts/billing/premium-request-management
  concepts/chat
  concepts/completions/code-referencing
  concepts/completions/code-suggestions
  concepts/context/content-exclusion
  concepts/context/mcp
  concepts/context/repository-indexing
  concepts/context/spaces
  concepts/copilot-usage-metrics/copilot-metrics
  concepts/mcp-management
  concepts/network-settings
  concepts/policies
  concepts/prompting/prompt-engineering
  concepts/prompting/response-customization
  concepts/rate-limits
  concepts/spark
  concepts/tools/about-copilot-integrations
  concepts/tools/ai-tools
  get-started/achieve-company-goals
  get-started/best-practices
  get-started/choose-enterprise-plan
  get-started/features
  get-started/plans
  get-started/quickstart
  get-started/what-is-github-copilot
  how-tos/administer-copilot/download-activity-report
  how-tos/administer-copilot/manage-for-enterprise/manage-access/disable-for-organizations
  how-tos/administer-copilot/manage-for-enterprise/manage-access/grant-access
  how-tos/administer-copilot/manage-for-enterprise/manage-access/manage-network-access
  how-tos/administer-copilot/manage-for-enterprise/manage-access/view-license-usage
  how-tos/administer-copilot/manage-for-enterprise/manage-agents/manage-copilot-code-review
  how-tos/administer-copilot/manage-for-enterprise/manage-agents/manage-copilot-coding-agent
  how-tos/administer-copilot/manage-for-enterprise/manage-agents/monitor-agentic-activity
  how-tos/administer-copilot/manage-for-enterprise/manage-agents/prepare-for-custom-agents
  how-tos/administer-copilot/manage-for-enterprise/manage-enterprise-policies
  how-tos/administer-copilot/manage-for-enterprise/manage-plan/cancel-plan
  how-tos/administer-copilot/manage-for-enterprise/manage-plan/downgrade-subscription
  how-tos/administer-copilot/manage-for-enterprise/manage-plan/subscribe
  how-tos/administer-copilot/manage-for-enterprise/manage-plan/upgrade-plan
  how-tos/administer-copilot/manage-for-enterprise/manage-spark
  how-tos/administer-copilot/manage-for-enterprise/use-your-own-api-keys
  how-tos/administer-copilot/manage-for-organization/add-copilot-coding-agent
  how-tos/administer-copilot/manage-for-organization/manage-access/grant-access
  how-tos/administer-copilot/manage-for-organization/manage-access/manage-network-access
  how-tos/administer-copilot/manage-for-organization/manage-access/manage-requests-for-access
  how-tos/administer-copilot/manage-for-organization/manage-access/revoke-access
  how-tos/administer-copilot/manage-for-organization/manage-plan/cancel
  how-tos/administer-copilot/manage-for-organization/manage-plan/subscribe
  how-tos/administer-copilot/manage-for-organization/manage-policies
  how-tos/administer-copilot/manage-for-organization/prepare-for-custom-agents
  how-tos/administer-copilot/manage-for-organization/review-activity/review-audit-logs
  how-tos/administer-copilot/manage-for-organization/review-activity/review-user-activity-data
  how-tos/administer-copilot/manage-for-organization/use-your-own-api-keys
  how-tos/administer-copilot/manage-mcp-usage/configure-mcp-registry
  how-tos/administer-copilot/manage-mcp-usage/configure-mcp-server-access
  how-tos/administer-copilot/view-code-generation
  how-tos/administer-copilot/view-usage-and-adoption
  how-tos/chat-with-copilot/chat-in-github
  how-tos/chat-with-copilot/chat-in-ide
  how-tos/chat-with-copilot/chat-in-mobile
  how-tos/chat-with-copilot/chat-in-windows-terminal
  how-tos/chat-with-copilot/get-started-with-chat
  how-tos/configure-content-exclusion/exclude-content-from-copilot
  how-tos/configure-content-exclusion/review-changes
  how-tos/configure-custom-instructions/add-organization-instructions
  how-tos/configure-custom-instructions/add-personal-instructions
  how-tos/configure-custom-instructions/add-repository-instructions
  how-tos/configure-personal-settings/authenticate-to-ghecom
  how-tos/configure-personal-settings/configure-in-ide
  how-tos/configure-personal-settings/configure-network-settings
  how-tos/copilot-cli/cli-best-practices
  how-tos/copilot-cli/cli-getting-started
  how-tos/copilot-cli/customize-copilot/add-custom-instructions
  how-tos/copilot-cli/customize-copilot/create-custom-agents-for-cli
  how-tos/copilot-cli/customize-copilot/create-skills
  how-tos/copilot-cli/customize-copilot/plugins-creating
  how-tos/copilot-cli/customize-copilot/plugins-finding-installing
  how-tos/copilot-cli/customize-copilot/plugins-marketplace
  how-tos/copilot-cli/customize-copilot/quickstart-for-customizing
  how-tos/copilot-cli/customize-copilot/use-hooks
  how-tos/copilot-cli/set-up-copilot-cli/configure-copilot-cli
  how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli
  how-tos/copilot-cli/use-copilot-cli
  how-tos/copilot-sdk/sdk-getting-started
  how-tos/get-code-suggestions/find-matching-code
  how-tos/get-code-suggestions/get-ide-code-suggestions
  how-tos/manage-and-track-spending/manage-company-spending
  how-tos/manage-and-track-spending/manage-request-allowances
  how-tos/manage-and-track-spending/monitor-premium-requests
  how-tos/manage-your-account/disable-copilot-free
  how-tos/manage-your-account/get-free-access-to-copilot-pro
  how-tos/manage-your-account/get-started-with-a-copilot-plan
  how-tos/manage-your-account/manage-policies
  how-tos/manage-your-account/view-and-change-your-copilot-plan
  how-tos/provide-context/use-copilot-spaces/collaborate-with-others
  how-tos/provide-context/use-copilot-spaces/create-copilot-spaces
  how-tos/provide-context/use-copilot-spaces/use-copilot-spaces
  how-tos/provide-context/use-mcp/change-mcp-registry
  how-tos/provide-context/use-mcp/configure-toolsets
  how-tos/provide-context/use-mcp/enterprise-configuration
  how-tos/provide-context/use-mcp/extend-copilot-chat-with-mcp
  how-tos/provide-context/use-mcp/set-up-the-github-mcp-server
  how-tos/provide-context/use-mcp/use-the-github-mcp-server
  how-tos/set-up/install-copilot-extension
  how-tos/set-up/set-up-a-dedicated-enterprise-for-copilot-business
  how-tos/set-up/set-up-for-enterprise
  how-tos/set-up/set-up-for-organization
  how-tos/set-up/set-up-for-self
  how-tos/troubleshoot-copilot/troubleshoot-common-issues
  how-tos/troubleshoot-copilot/troubleshoot-firewall-settings
  how-tos/troubleshoot-copilot/troubleshoot-network-errors
  how-tos/troubleshoot-copilot/troubleshoot-spark
  how-tos/troubleshoot-copilot/view-logs
  how-tos/use-ai-models/change-the-chat-model
  how-tos/use-ai-models/change-the-completion-model
  how-tos/use-ai-models/configure-access-to-ai-models
  how-tos/use-copilot-agents/coding-agent/changing-the-ai-model
  how-tos/use-copilot-agents/coding-agent/create-a-pr
  how-tos/use-copilot-agents/coding-agent/create-custom-agents
  how-tos/use-copilot-agents/coding-agent/create-skills
  how-tos/use-copilot-agents/coding-agent/customize-the-agent-environment
  how-tos/use-copilot-agents/coding-agent/customize-the-agent-firewall
  how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp
  how-tos/use-copilot-agents/coding-agent/integrate-coding-agent-with-azure-boards
  how-tos/use-copilot-agents/coding-agent/integrate-coding-agent-with-linear
  how-tos/use-copilot-agents/coding-agent/integrate-coding-agent-with-slack
  how-tos/use-copilot-agents/coding-agent/integrate-coding-agent-with-teams
  how-tos/use-copilot-agents/coding-agent/make-changes-to-an-existing-pr
  how-tos/use-copilot-agents/coding-agent/provide-visual-inputs
  how-tos/use-copilot-agents/coding-agent/review-copilot-prs
  how-tos/use-copilot-agents/coding-agent/test-custom-agents
  how-tos/use-copilot-agents/coding-agent/track-copilot-sessions
  how-tos/use-copilot-agents/coding-agent/troubleshoot-coding-agent
  how-tos/use-copilot-agents/coding-agent/use-hooks
  how-tos/use-copilot-agents/copilot-memory
  how-tos/use-copilot-agents/manage-agents
  how-tos/use-copilot-agents/request-a-code-review/configure-automatic-review
  how-tos/use-copilot-agents/request-a-code-review/configure-self-hosted-runners
  how-tos/use-copilot-agents/request-a-code-review/use-code-review
  how-tos/use-copilot-for-common-tasks/create-a-pr-summary
  how-tos/use-copilot-for-common-tasks/use-copilot-in-the-cli
  how-tos/use-copilot-for-common-tasks/use-copilot-to-create-or-update-issues
  reference/acp-server
  reference/agentic-audit-log-events
  reference/ai-models/model-comparison
  reference/ai-models/model-hosting
  reference/ai-models/supported-models
  reference/cheat-sheet
  reference/cli-command-reference
  reference/cli-plugin-reference
  reference/copilot-allowlist-reference
  reference/copilot-billing/azure-billing
  reference/copilot-billing/billing-cycle
  reference/copilot-billing/license-changes
  reference/copilot-billing/seat-assignment
  reference/copilot-feature-matrix
  reference/copilot-usage-metrics/copilot-usage-metrics
  reference/copilot-usage-metrics/interpret-copilot-metrics
  reference/copilot-usage-metrics/lines-of-code-metrics
  reference/copilot-usage-metrics/reconciling-usage-metrics
  reference/custom-agents-configuration
  reference/custom-instructions-support
  reference/hooks-configuration
  reference/keyboard-shortcuts
  reference/mcp-allowlist-enforcement
  reference/metrics-data
  reference/policy-conflicts
  reference/review-excluded-files
  responsible-use/chat-in-github
  responsible-use/chat-in-github-mobile
  responsible-use/chat-in-your-ide
  responsible-use/code-review
  responsible-use/copilot-cli
  responsible-use/copilot-code-completion
  responsible-use/copilot-coding-agent
  responsible-use/copilot-commit-message-generation
  responsible-use/copilot-in-github-desktop
  responsible-use/copilot-in-windows-terminal
  responsible-use/copilot-spaces
  responsible-use/pull-request-summaries
  responsible-use/spark
  tutorials/coding-agent/get-the-best-results
  tutorials/coding-agent/improve-a-project
  tutorials/coding-agent/pilot-coding-agent
  tutorials/compare-ai-models
  tutorials/copilot-chat-cookbook/analyze-functionality/analyze-feedback
  tutorials/copilot-chat-cookbook/analyze-functionality/explore-implementations
  tutorials/copilot-chat-cookbook/analyze-security/find-vulnerabilities
  tutorials/copilot-chat-cookbook/analyze-security/manage-dependency-updates
  tutorials/copilot-chat-cookbook/analyze-security/secure-your-repository
  tutorials/copilot-chat-cookbook/communicate-effectively/creating-diagrams
  tutorials/copilot-chat-cookbook/communicate-effectively/creating-templates
  tutorials/copilot-chat-cookbook/communicate-effectively/extracting-information
  tutorials/copilot-chat-cookbook/communicate-effectively/generating-tables
  tutorials/copilot-chat-cookbook/communicate-effectively/synthesizing-research
  tutorials/copilot-chat-cookbook/debug-errors/debug-invalid-json
  tutorials/copilot-chat-cookbook/debug-errors/diagnose-test-failures
  tutorials/copilot-chat-cookbook/debug-errors/handle-api-rate-limits
  tutorials/copilot-chat-cookbook/document-code/creating-issues
  tutorials/copilot-chat-cookbook/document-code/document-legacy-code
  tutorials/copilot-chat-cookbook/document-code/explain-complex-logic
  tutorials/copilot-chat-cookbook/document-code/explain-legacy-code
  tutorials/copilot-chat-cookbook/document-code/sync-documentation
  tutorials/copilot-chat-cookbook/document-code/write-discussions-or-blog-posts
  tutorials/copilot-chat-cookbook/refactor-code/decouple-business-logic
  tutorials/copilot-chat-cookbook/refactor-code/fix-database-deadlocks
  tutorials/copilot-chat-cookbook/refactor-code/fix-lint-errors
  tutorials/copilot-chat-cookbook/refactor-code/handle-cross-cutting
  tutorials/copilot-chat-cookbook/refactor-code/improve-code-readability
  tutorials/copilot-chat-cookbook/refactor-code/refactor-data-access-layers
  tutorials/copilot-chat-cookbook/refactor-code/refactor-design-patterns
  tutorials/copilot-chat-cookbook/refactor-code/refactor-for-optimization
  tutorials/copilot-chat-cookbook/refactor-code/refactor-for-sustainability
  tutorials/copilot-chat-cookbook/refactor-code/simplify-inheritance-hierarchies
  tutorials/copilot-chat-cookbook/refactor-code/translate-code
  tutorials/copilot-chat-cookbook/testing-code/create-end-to-end-tests
  tutorials/copilot-chat-cookbook/testing-code/create-mock-objects
  tutorials/copilot-chat-cookbook/testing-code/generate-unit-tests
  tutorials/copilot-chat-cookbook/testing-code/update-unit-tests
  tutorials/copilot-cli-hooks
  tutorials/customization-library/custom-agents/bug-fix-teammate
  tutorials/customization-library/custom-agents/cleanup-specialist
  tutorials/customization-library/custom-agents/implementation-planner
  tutorials/customization-library/custom-agents/your-first-custom-agent
  tutorials/customization-library/custom-instructions/accessibility-auditor
  tutorials/customization-library/custom-instructions/code-reviewer
  tutorials/customization-library/custom-instructions/concept-explainer
  tutorials/customization-library/custom-instructions/debugging-tutor
  tutorials/customization-library/custom-instructions/github-actions-helper
  tutorials/customization-library/custom-instructions/issue-manager
  tutorials/customization-library/custom-instructions/pull-request-assistant
  tutorials/customization-library/custom-instructions/testing-automation
  tutorials/customization-library/custom-instructions/your-first-custom-instructions
  tutorials/customization-library/prompt-files/create-readme
  tutorials/customization-library/prompt-files/document-api
  tutorials/customization-library/prompt-files/generate-unit-tests
  tutorials/customization-library/prompt-files/onboarding-plan
  tutorials/customization-library/prompt-files/review-code
  tutorials/customization-library/prompt-files/your-first-prompt-file
  tutorials/enhance-agent-mode-with-mcp
  tutorials/explore-a-codebase
  tutorials/explore-issues-and-discussions
  tutorials/explore-pull-requests
  tutorials/learn-a-new-language
  tutorials/migrate-a-project
  tutorials/modernize-java-applications
  tutorials/modernize-legacy-code
  tutorials/optimize-code-reviews
  tutorials/plan-a-project
  tutorials/reduce-technical-debt
  tutorials/refactor-code
  tutorials/review-ai-generated-code
  tutorials/roll-out-at-scale/assign-licenses/remind-inactive-users
  tutorials/roll-out-at-scale/assign-licenses/set-up-self-serve-licenses
  tutorials/roll-out-at-scale/assign-licenses/track-usage-and-adoption
  tutorials/roll-out-at-scale/drive-downstream-impact/accelerate-pull-requests
  tutorials/roll-out-at-scale/drive-downstream-impact/increase-test-coverage
  tutorials/roll-out-at-scale/drive-downstream-impact/reduce-security-debt
  tutorials/roll-out-at-scale/enable-developers/drive-adoption
  tutorials/roll-out-at-scale/enable-developers/integrate-ai-agents
  tutorials/roll-out-at-scale/establish-ai-managers
  tutorials/roll-out-at-scale/measure-success
  tutorials/spark/build-apps-with-spark
  tutorials/spark/deploy-from-cli
  tutorials/spark/prompt-tips
  tutorials/spark/your-first-spark
  tutorials/speed-up-development-work
  tutorials/upgrade-projects
  tutorials/use-custom-instructions
  tutorials/vibe-coding
  tutorials/write-tests
)

mkdir -p "$CP_DIR"

echo "==> Syncing Copilot docs (${#CP_PAGES[@]} pages from GitHub raw)..."

cp_ok=0
cp_fail=0

for path in "${CP_PAGES[@]}"; do
  mkdir -p "$CP_DIR/$(dirname "$path")"
  if curl -sfL "$CP_RAW/${path}.md" -o "$CP_DIR/${path}.md"; then
    ((cp_ok++))
  else
    echo "  FAIL: ${path}.md"
    ((cp_fail++))
  fi
done

echo "  Done: ${cp_ok} ok, ${cp_fail} failed"

# ── Antigravity docs ─────────────────────────────────────────────────
AG_BASE="https://antigravity.google"
AG_DIR="$DOCS_DIR/antigravity"

AG_PAGES=(
  home
  get-started
  agent
  models
  agent-modes-settings
  rules-workflows
  skills
  task-groups
  browser-subagent
  strict-mode
  sandbox-mode
  mcp
  artifacts
  task-list
  implementation-plan
  walkthrough
  screenshots
  browser-recordings
  knowledge
  editor
  tab
  command
  agent-side-panel
  review-changes-editor
  agent-manager
  workspaces
  playground
  inbox
  conversation-view
  browser-subagent-view
  panes
  review-changes-manager
  changes-sidebar
  terminal
  files
  browser
  chrome-extension
  allowlist-denylist
  separate-chrome-profile
  plans
  settings
  faq
)

mkdir -p "$AG_DIR"

echo "==> Syncing Antigravity docs (${#AG_PAGES[@]} pages via r.jina.ai)..."

ag_ok=0
ag_fail=0

for slug in "${AG_PAGES[@]}"; do
  if curl -sfL "https://r.jina.ai/${AG_BASE}/docs/${slug}" -o "$AG_DIR/${slug}.md"; then
    ((ag_ok++))
  else
    echo "  FAIL: ${slug}"
    ((ag_fail++))
  fi
  sleep 4  # r.jina.ai free tier rate limit (~20 RPM)
done

echo "  Done: ${ag_ok} ok, ${ag_fail} failed"

# ── Summary ───────────────────────────────────────────────────────────
total_ok=$((cc_ok + cx_ok + cr_ok + oc_ok + cp_ok + ag_ok))
total_fail=$((cc_fail + cx_fail + cr_fail + oc_fail + cp_fail + ag_fail))
echo ""
echo "==> Total: ${total_ok} ok, ${total_fail} failed"
