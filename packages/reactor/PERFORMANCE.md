# Performance Benchmarks

## Bundle Size

- **Full Package**: 55.23 KB → **13.27 KB gzipped** ✅ (+2.4 KB from v0.2.2)
- **Plugins Only**: 3.27 KB → **1.05 KB gzipped** ✅
- **Tree-shakeable**: Yes ✅

**Note:** Bundle size increased in v0.2.3 due to new features:
- Retry logic with backoff algorithms (+0.8 KB)
- Debounce & cancellation support (+0.6 KB)
- Advanced logger filtering (+0.5 KB)
- Path utilities for pick/omit (+0.3 KB)
- Bulk operations for arrays (+0.2 KB)

## Benchmark Results

### State Updates

| Operation | Operations/sec | Mean (ms) |
|-----------|----------------|-----------|
| Simple state update | **26,884** | 0.037 |
| Complex state update | **14,060** | 0.071 |
| 100 sequential updates | **331** | 3.018 |

**Key Takeaways:**
- Single updates are extremely fast (**< 0.1ms**)
- Complex state changes maintain good performance
- Batch operations scale linearly

### Undo/Redo Performance

| Operation | Operations/sec | Mean (ms) |
|-----------|----------------|-----------|
| Update with undo/redo | **11,636** | 0.086 |
| 100 updates with history | **185** | 5.414 |
| Batch 100 updates | **267** | 3.750 |

**Key Takeaways:**
- Undo/Redo adds minimal overhead (~0.05ms per operation)
- Batching significantly improves performance for multiple updates
- History tracking has acceptable overhead

### History Operations

| Operation | Operations/sec | Mean (ms) |
|-----------|----------------|-----------|
| 50 undos | **318** | 3.141 |
| 50 redos | **323** | 3.099 |

**Key Takeaways:**
- Undo/redo operations are symmetric in performance
- ~60µs per undo/redo operation
- Excellent for interactive applications

### Large State Performance

| Operation | Operations/sec | Mean (ms) |
|-----------|----------------|-----------|
| Update large array (1000 items) | **107** | 9.384 |
| Update large object (100 properties) | **2,916** | 0.343 |

**Key Takeaways:**
- Object updates scale better than array updates
- Large state still maintains reasonable performance
- Deep cloning is the main bottleneck for large arrays

### Reactor Creation

| Operation | Operations/sec | Mean (ms) |
|-----------|----------------|-----------|
| Create simple reactor | **558,098** | 0.0018 |
| Create with complex state | **296,729** | 0.0034 |
| Create with undo/redo | **40,595** | 0.0246 |

**Key Takeaways:**
- Reactor creation is extremely fast
- Undo/redo plugin adds ~0.02ms overhead
- Complex state has minimal impact

## Performance Goals

✅ **Update operations**: < 1ms for simple updates
✅ **Undo/Redo**: < 0.1ms overhead per operation
✅ **Bundle size**: < 15KB gzipped (full package)
✅ **Memory**: Reasonable memory usage with history limits

## Optimization Opportunities

1. **Large Array Updates**: Consider using patches instead of full clones
2. **History Compression**: Already implemented for identical consecutive states
3. **Selective Serialization**: Use shallow comparison for updates (future)

## Running Benchmarks

```bash
cd packages/reactor
pnpm bench
```

## System Information

- **Node Version**: v18+
- **Platform**: Cross-platform (Windows, macOS, Linux)
- **Test Environment**: vitest bench runner
