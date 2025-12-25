# Retail ERP Contributing Guide

## How to Contribute

We welcome contributions to the Retail Store ERP system!

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourname/retail-erp.git`
3. Create a feature branch: `git checkout -b feature/amazing-feature`
4. Make your changes
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Start development servers
npm run dev
```

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript/React best practices
- Add comments for complex logic
- Keep functions small and focused

### Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

### Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit to 72 characters or less
- Reference issues and pull requests liberally

### Pull Request Process

1. Update README.md with any new features
2. Update documentation if needed
3. Ensure tests pass
4. Request review from maintainers

### Reporting Bugs

1. Check if the bug is already reported
2. Provide clear title and description
3. Include reproduction steps
4. Share your environment info
5. Attach screenshots if possible

### Feature Requests

1. Use clear, descriptive titles
2. Provide specific use cases
3. List any related features
4. Explain why this would be useful

### Code of Conduct

- Be respectful and inclusive
- Focus on what's best for the project
- Provide constructive feedback
- Support fellow contributors

## Questions?

- Open an issue with [Question] prefix
- Check existing issues and discussions
- Contact the maintainers

Thank you for contributing! 🎉
