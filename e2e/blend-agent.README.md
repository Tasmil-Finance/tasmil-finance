# Blend Agent E2E Test Suite

## Tổng quan
Test suite toàn diện cho Blend Agent với 28 test cases được thiết kế để kiểm tra tất cả các khía cạnh của agent.

## Cấu trúc Test

### 1. Basic Cases (5 tests)
Kiểm tra các chức năng cơ bản của Blend agent:
- ✅ Hiển thị agent card
- ✅ Mở chat interface
- ✅ Hiển thị danh sách pools
- ✅ Hiển thị thông tin APY
- ✅ Hiển thị user positions

### 2. Complex Cases (6 tests)
Kiểm tra các workflow phức tạp:
- ✅ Thực hiện supply transaction
- ✅ Thực hiện borrow transaction
- ✅ So sánh nhiều pools
- ✅ Tính toán optimal strategy
- ✅ Multi-step workflow (3 bước)
- ✅ Cross-chain scenario (bridge + supply)

### 3. Edge Cases (15 tests)
Kiểm tra các trường hợp đặc biệt và error handling:
- ✅ Insufficient balance
- ✅ Invalid asset
- ✅ Zero amount
- ✅ Negative amount
- ✅ Network errors
- ✅ Timeout scenarios
- ✅ Wallet disconnection during transaction
- ✅ Concurrent requests
- ✅ Malformed input
- ✅ Very long input
- ✅ Rapid consecutive messages
- ✅ Context maintenance after error
- ✅ Health factor warnings
- ✅ Pool capacity limits
- ✅ Stale data refresh

### 4. Performance Tests (2 tests)
Kiểm tra hiệu suất:
- ✅ Response time < 10 seconds
- ✅ Large pool lists rendering

## Thống kê

- **Tổng số test cases**: 28
- **Tổng số tests** (across all browsers): 196
  - Chromium: 28 tests
  - Firefox: 28 tests
  - WebKit: 28 tests
  - Mobile Chrome: 28 tests
  - Mobile Safari: 28 tests
  - Microsoft Edge: 28 tests
  - Google Chrome: 28 tests

## Chạy Tests

### Chạy tất cả tests
```bash
cd apps/frontend
pnpm test:e2e blend-agent.spec.ts
```

### Chạy trên một browser cụ thể
```bash
pnpm test:e2e blend-agent.spec.ts --project=chromium
```

### Chạy với UI mode
```bash
pnpm test:e2e:ui blend-agent.spec.ts
```

### Chạy với debug mode
```bash
pnpm test:e2e:debug blend-agent.spec.ts
```

### Chạy một test cụ thể
```bash
pnpm test:e2e blend-agent.spec.ts -g "should display Blend agent card"
```

## Test Data Requirements

Tests sử dụng mock data và fixtures:
- Mock wallet connection
- Mock Blend pools data
- Mock transaction responses
- Mock network errors

## Coverage Areas

### Functional Testing
- ✅ Agent discovery và navigation
- ✅ Chat interface interaction
- ✅ Pool information display
- ✅ Transaction execution
- ✅ Multi-step workflows
- ✅ Cross-chain operations

### Error Handling
- ✅ Input validation
- ✅ Network failures
- ✅ Timeout handling
- ✅ Wallet errors
- ✅ Concurrent operations
- ✅ Context recovery

### Performance
- ✅ Response time
- ✅ Large data rendering
- ✅ Concurrent requests

### Cross-browser
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (Chrome, Safari)

## Expected Behavior

### Success Scenarios
- Agent responds within 10 seconds
- Transactions show preview before execution
- Clear success/error messages
- Context maintained across conversations

### Error Scenarios
- Graceful error messages
- No crashes on invalid input
- Recovery after errors
- Proper timeout handling

## Notes

- Tests require dev server running on `http://localhost:3000`
- Global setup/teardown handles test environment
- Screenshots captured on failure
- Videos recorded on failure
- Traces available for debugging

## Future Enhancements

- [ ] Add visual regression tests
- [ ] Add accessibility tests
- [ ] Add load testing
- [ ] Add API mocking for more scenarios
- [ ] Add test data generators
- [ ] Add performance benchmarks
