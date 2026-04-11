export interface SM2Input {
    quality: number
    repetitions: number
    easeFactor: number
    interval: number
}

export interface SM2Output {
    repetitions: number
    easeFactor: number
    interval: number
    nextReviewAt: Date
}

export function calculateNextReview(input: SM2Input): SM2Output {
    const { quality, repetitions, easeFactor, interval } = input

    let nextInterval: number
    let nextRepetitions: number
    let nextEF: number

    if (quality < 3) {
        // Failed — reset repetitions, keep easeFactor
        nextInterval = 1
        nextRepetitions = 0
        nextEF = easeFactor
    } else {
        // Passed
        if (repetitions === 0) nextInterval = 1
        else if (repetitions === 1) nextInterval = 6
        else nextInterval = Math.round(interval * easeFactor)

        nextRepetitions = repetitions + 1
        nextEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        nextEF = Math.max(1.3, nextEF)
    }

    const nextReviewAt = new Date()
    nextReviewAt.setDate(nextReviewAt.getDate() + nextInterval)

    return { repetitions: nextRepetitions, easeFactor: nextEF, interval: nextInterval, nextReviewAt }
}