// https://github.com/taleinat/levenshtein-search
function fuzzyMatch (a, b, maxDist) {
	maxDist = Math.ceil(maxDist/5) * maxDist
	if (a.length > b.length) {
	  [a, b] = [b, a]
	}
	a = a.toLowerCase(); //capinski
	b = b.toLowerCase(); //capinski
	b = b.substring(0,a.length); //capinski
	const lenDelta = b.length - a.length
	if (lenDelta > maxDist) {
	  return false
	}
  
	if (maxDist === 0) {
	  return a === b
	}
  
	let firstDiffIdx
	for (firstDiffIdx = 0; firstDiffIdx < a.length; firstDiffIdx++) {
	  if (a[firstDiffIdx] !== b[firstDiffIdx]) break
	}
	if (firstDiffIdx === a.length) {
	  return lenDelta <= maxDist
	}
  
	let lastDiffIdx
	for (lastDiffIdx = a.length - 1; lastDiffIdx >= 0; lastDiffIdx--) {
	  if (a[lastDiffIdx] !== b[lastDiffIdx + lenDelta]) break
	}
  
	a = a.slice(firstDiffIdx, lastDiffIdx + 1)
	b = b.slice(firstDiffIdx, lastDiffIdx + 1 + lenDelta)
  
	const [dist, length] = _expand(a, b, maxDist)
	return dist + (b.length - length) <= maxDist
  }
  function _expand (needle, haystack, maxDist) {
	maxDist = +maxDist
  
	let firstDiff
	for (firstDiff = 0; firstDiff < Math.min(needle.length, haystack.length); firstDiff++) {
	  if (needle.charCodeAt(firstDiff) !== haystack.charCodeAt(firstDiff)) break
	}
	if (firstDiff) {
	  needle = needle.slice(firstDiff)
	  haystack = haystack.slice(firstDiff)
	}
  
	if (!needle) {
	  return [0, firstDiff]
	} else if (!haystack) {
	  if (needle.length <= maxDist) {
		return [needle.length, firstDiff]
	  } else {
		return [null, null]
	  }
	}
  
	if (maxDist === 0) return [null, null]
  
	let scores = new Array(needle.length + 1)
	for (let i = 0; i <= maxDist; i++) {
	  scores[i] = i
	}
	let newScores = new Array(needle.length + 1)
  
	let minScore = null
	let minScoreIdx = null
	let maxGoodScore = maxDist
	let firstGoodScoreIdx = 0
	let lastGoodScoreIdx = needle.length - 1
  
	for (let haystackIdx = 0; haystackIdx < haystack.length; haystackIdx++) {
	  const char = haystack.charCodeAt(haystackIdx)
  
	  const needleIdxStart = Math.max(0, firstGoodScoreIdx - 1)
	  const needleIdxLimit = Math.min(
		haystackIdx + maxDist,
		needle.length - 1,
		lastGoodScoreIdx
	  )
  
	  newScores[0] = scores[0] + 1
	  firstGoodScoreIdx = newScores[0] <= maxGoodScore ? 0 : null
	  lastGoodScoreIdx = newScores[0] <= maxGoodScore ? 0 : -1
  
	  let needleIdx
	  for (needleIdx = needleIdxStart; needleIdx < needleIdxLimit; needleIdx++) {
		const score = newScores[needleIdx + 1] = Math.min(
		  scores[needleIdx] + +(char !== needle.charCodeAt(needleIdx)),
		  scores[needleIdx + 1] + 1,
		  newScores[needleIdx] + 1
		)
		if (score <= maxGoodScore) {
		  if (firstGoodScoreIdx === null) firstGoodScoreIdx = needleIdx + 1
		  lastGoodScoreIdx = Math.max(
			lastGoodScoreIdx,
			needleIdx + 1 + (maxGoodScore - score)
		  )
		}
	  }
  
	  const lastScore = newScores[needleIdx + 1] = Math.min(
		scores[needleIdx] + +(char !== needle.charCodeAt(needleIdx)),
		newScores[needleIdx] + 1
	  )
	  if (lastScore <= maxGoodScore) {
		if (firstGoodScoreIdx === null) firstGoodScoreIdx = needleIdx + 1
		lastGoodScoreIdx = needleIdx + 1
	  }
  
	  if (
		needleIdx === needle.length - 1 &&
		(minScore === null || lastScore <= minScore)
	  ) {
		minScore = lastScore
		minScoreIdx = haystackIdx
		if (minScore < maxGoodScore) maxGoodScore = minScore
	  }
  
	  [scores, newScores] = [newScores, scores]
  
	  if (firstGoodScoreIdx === null) break
	}
  
	if (minScore !== null && minScore <= maxDist) {
	  return [minScore, minScoreIdx + 1 + firstDiff]
	} else {
	  return [null, null]
	}
  }