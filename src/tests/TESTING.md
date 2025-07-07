# Testing Philosophy for Hayai v0.4.1

## 🎯 Keep It Simple

Hayai v0.4.1 supports **19 databases across 8 categories** and includes the new **`.hayaidb` configuration system**. Our testing approach is:

### ✅ What we test:
- **Basic validation** - Ensure core functionality works
- **Critical paths** - Database templates are configured correctly  
- **Smoke tests** - The app can start and run
- **Category validation** - SQL(4), Embedded(1), Key-Value(1), Wide Column(1), Vector(3), Graph(1), Search(2), Time Series(6)
- **Export/Sync** - `.hayaidb` file generation and database recreation

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

# Test .hayaidb functionality
npm run dev -- export
npm run dev -- sync --dry-run
```

## 📝 Writing Tests

Only add tests that:
1. **Catch real bugs** you've encountered
2. **Validate critical functionality** 
3. **Are easy to maintain** as the API evolves
4. **Test database categorization** - Ensure databases are in correct categories

## 🔄 Future

As the project stabilizes and the API solidifies, we'll gradually add more comprehensive tests. For now, **flexibility > coverage**.

Remember: **Tests should help development, not hinder it!**

## 🗂️ Database Categories Testing

When testing new databases, verify they're in the correct category:
- **SQL databases** should support SELECT, INSERT, UPDATE, DELETE
- **Embedded databases** should work without network ports
- **Vector databases** should support similarity search
- **Time series databases** should handle time-based queries efficiently 