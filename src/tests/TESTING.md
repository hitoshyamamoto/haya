# Testing Philosophy for Hayai

## 🎯 Keep It Simple

Hayai is in active development and will evolve based on community feedback. Our testing approach is:

### ✅ What we test:
- **Basic validation** - Ensure core functionality works
- **Critical paths** - Database templates are configured correctly
- **Smoke tests** - The app can start and run

### ❌ What we DON'T test (yet):
- Every edge case
- Every CLI command variation
- Mock Docker interactions
- 100% code coverage

## 🚀 Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test templates.test.ts
```

## 📝 Writing Tests

Only add tests that:
1. **Catch real bugs** you've encountered
2. **Validate critical functionality** 
3. **Are easy to maintain** as the API evolves

## 🔄 Future

As the project stabilizes and the API solidifies, we'll gradually add more comprehensive tests. For now, **flexibility > coverage**.

Remember: **Tests should help development, not hinder it!** 