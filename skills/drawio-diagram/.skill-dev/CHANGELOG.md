# Changelog

All notable changes to the drawio-diagram skill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2025-12-14

### Added

- Initial skill creation from next-ai-draw-io v0.4.0
- **SKILL.md**: Core guide with tools, validation rules, layout constraints
- **Tools defined**:
  - `display_diagram` - Create new diagrams
  - `edit_diagram` - Edit existing diagrams with search/replace
  - `append_diagram` - Continue truncated output
- **references/xml-format.md**: Complete XML schema reference
- **references/validation-rules.md**: Validation rules and auto-fix logic
- **references/edge-routing.md**: Edge routing rules to avoid overlapping
- **references/cloud-icons.md**: AWS/GCP/Azure icon styles
- **examples/**: Flowchart, swimlane, AWS architecture examples
- **.skill-dev/**: Maintenance infrastructure
  - SOURCE_MAP.md - Content source tracking
  - SYNC_CHECKLIST.md - Upstream sync guide
  - VERSION_LOCK.md - Version locking
  - CHANGELOG.md - This file

### Source

- **Upstream Commit**: 0851b32
- **Commit Message**: refactor: simplify LLM XML format to output bare mxCells only

### Notes

This skill extracts the core knowledge from next-ai-draw-io project:
- System prompts for diagram generation
- XML validation logic
- Tool definitions
- Best practices for layout and edge routing

---

## [Unreleased]

### Planned

- [ ] Add more diagram examples (sequence, ER, class diagrams)
- [ ] Add validation script for CLI usage
- [ ] Expand cloud icons reference with more providers
