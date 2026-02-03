# Contributing Guidelines

## Code Style

- Use **TypeScript** with strict mode
- No `any` types - always specify types
- Use `const` by default, `let` if needed
- Follow naming conventions:
  - Classes: PascalCase
  - Functions/variables: camelCase
  - Constants: UPPER_SNAKE_CASE

## Pull Request Process

1. Create feature branch: `feature/description`
2. Write tests for new code
3. Run: `npm run type-check && npm run lint`
4. Ensure coverage stays above 70%
5. Write clear commit messages
6. Update documentation

## Architecture Rules

- ✅ Controllers handle HTTP only
- ✅ Services handle business logic
- ✅ Repositories handle data access
- ✅ No database calls outside repositories
- ✅ No HTTP logic in services
- ✅ No circular dependencies
- ✅ No hard-coded configs
- ✅ Use dependency injection where possible

## Testing Requirements

- Write unit tests for services
- Write integration tests for APIs
- Maintain 70%+ coverage
- Test error cases
- Test edge cases

## Security Considerations

- Never log passwords or secrets
- Always validate and sanitize inputs
- Use parameterized queries
- Implement rate limiting on sensitive endpoints
- Add audit logging for sensitive operations
- Use HTTPS in production

## Commit Message Format

```
type(scope): brief description

Longer explanation if needed. Reference issue #123.

- Bullet point 1
- Bullet point 2
```

Types: feat, fix, docs, style, refactor, test, chore

## Questions?

Feel free to open an issue or discussion for questions.
