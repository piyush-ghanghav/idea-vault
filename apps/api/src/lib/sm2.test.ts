import { describe, it, expect } from 'vitest'
import { calculateNextReview } from './sm2'

describe('SM-2 algorithm', () => {

  it('first successful review sets interval to 1', () => {
    const result = calculateNextReview({
      quality: 4,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
    })
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('second successful review sets interval to 6', () => {
    const result = calculateNextReview({
      quality: 4,
      repetitions: 1,
      easeFactor: 2.5,
      interval: 1,
    })
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
  })

  it('third review multiplies interval by easeFactor', () => {
    const result = calculateNextReview({
      quality: 4,
      repetitions: 2,
      easeFactor: 2.5,
      interval: 6,
    })
    expect(result.interval).toBe(15) // Math.round(6 * 2.5)
    expect(result.repetitions).toBe(3)
  })

  it('failed review resets interval and repetitions', () => {
    const result = calculateNextReview({
      quality: 1,
      repetitions: 5,
      easeFactor: 2.5,
      interval: 30,
    })
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
    expect(result.easeFactor).toBe(2.5) 
  })

  it('easeFactor never drops below 1.3', () => {
    let state = { quality: 3, repetitions: 0, easeFactor: 1.31, interval: 1 }
    const result = calculateNextReview(state)
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3)
  })

  it('perfect review increases easeFactor', () => {
    const result = calculateNextReview({
      quality: 5,
      repetitions: 1,
      easeFactor: 2.5,
      interval: 1,
    })
    expect(result.easeFactor).toBeGreaterThan(2.5)
  })

  it('nextReviewAt is in the future', () => {
    const result = calculateNextReview({
      quality: 4,
      repetitions: 0,
      easeFactor: 2.5,
      interval: 1,
    })
    expect(result.nextReviewAt.getTime()).toBeGreaterThan(Date.now())
  })

})