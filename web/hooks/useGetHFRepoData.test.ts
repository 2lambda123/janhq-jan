import { renderHook, act } from '@testing-library/react'
import { useGetHFRepoData } from './useGetHFRepoData'
import { extensionManager } from '@/extension'

jest.mock('@/extension', () => ({
  extensionManager: {
    get: jest.fn(),
  },
}))

describe('useGetHFRepoData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch HF repo data successfully', async () => {
    const mockData = { name: 'Test Repo', stars: 100 }
    const mockFetchHuggingFaceRepoData = jest.fn().mockResolvedValue(mockData)
    ;(extensionManager.get as jest.Mock).mockReturnValue({
      fetchHuggingFaceRepoData: mockFetchHuggingFaceRepoData,
    })

    const { result } = renderHook(() => useGetHFRepoData())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeUndefined()

    let data
    act(() => {
      data = result.current.getHfRepoData('test-repo')
    })

    expect(result.current.loading).toBe(true)

    expect(result.current.error).toBeUndefined()
    expect(await data).toEqual(mockData)
    expect(mockFetchHuggingFaceRepoData).toHaveBeenCalledWith('test-repo')
  })
})
