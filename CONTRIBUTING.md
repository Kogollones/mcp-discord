# Contributing to MCP Discord Extended

Thank you for your interest in contributing! This document provides guidelines and steps for contributing.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Kogollones/mcp-discord/issues)
2. If not, create a new issue using the bug report template
3. Include:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Node.js version
   - Discord.js version

### Suggesting Features

1. Check existing [Issues](https://github.com/Kogollones/mcp-discord/issues) for similar suggestions
2. Create a new issue using the feature request template
3. Describe the feature and its use case

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages: `git commit -m "Add: description"`
6. Push to your fork: `git push origin feature/your-feature`
7. Open a Pull Request

### Commit Message Format

Use clear, descriptive commit messages:

```
Add: new feature description
Fix: bug description
Update: what was updated
Remove: what was removed
Docs: documentation changes
```

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/mcp-discord.git
cd mcp-discord

# Install dependencies
npm install

# Make your changes in the build/ directory
# Test with your Discord bot
```

## Code Style

- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Follow existing code patterns
- Keep functions focused and small

## Testing

Before submitting:

1. Test all modified tools manually
2. Verify no breaking changes to existing functionality
3. Test with different Discord server configurations

## Questions?

Open an issue with the `question` label or start a discussion.

---

Thank you for contributing!
