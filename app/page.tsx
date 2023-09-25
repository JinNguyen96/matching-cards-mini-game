'use client'
import { useEffect, useRef, useState } from 'react'

const generateRandomNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)
const generateMap = (min: number, max: number, amount: number) => {
  let result: number[][] = []
    Array(amount).fill(0).forEach((_, index) => {
      result.push([])
      Array(amount).fill(0).forEach((_, indexY) => {
        result[index].push(0)
      })
  })
  const pairAmount = amount ** 2 / 2

  let idList: number[] = []
  for (let i = 0; i < pairAmount; i++) {
    let generatedValue = 0
    do {
      generatedValue = generateRandomNumber(min, max)
    } while (idList.includes(generatedValue))
    idList.push(generatedValue)
    let yCordinate = 0 
    let xCordinate = i
    do {
      xCordinate = generateRandomNumber(0, amount - 1)
      yCordinate = generateRandomNumber(0, amount - 1)
    } while (result[xCordinate][yCordinate] !== 0)
    result[xCordinate][yCordinate] = generatedValue
    do {
      xCordinate = generateRandomNumber(0, amount - 1)
      yCordinate = generateRandomNumber(0, amount - 1)
    } while (result[xCordinate][yCordinate] !== 0)
    result[xCordinate][yCordinate] = generatedValue
  }

  return {result, idList}
}
const AXIE_IMAGE_URL = `https://axiecdn.axieinfinity.com/axies/:id/axie/axie-full-transparent.png`

// only allow event number
const METRIC_SIZE = 2 

type Cordinate = {
  x: number,
  y: number
}

export default function Home() {
  const [score, setScore] = useState<number>(0)
  const [cardMetric, setCardMetric] = useState<number[][]>([])
  const [selectedCards, setSelectedCards] = useState<Cordinate[]>([])

  const resetTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const removePairTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  let initRefsMetric: (HTMLCanvasElement | null)[][] = []
  Array(METRIC_SIZE).fill(0).forEach((_, x) => {
    initRefsMetric.push([])
    Array(METRIC_SIZE).fill(0).forEach((_, y) => {
      initRefsMetric[x].push(null)
    })
  })
  const canvasRefs = useRef<(HTMLCanvasElement | null)[][]>(initRefsMetric)

  const onSelectCard = (cordinate: Cordinate) => () => {
    if (cordinate.x === selectedCards[0]?.x && cordinate.y === selectedCards[0]?.y || cardMetric[cordinate.x][cordinate.y] === 0) {
      return
    }
    if (selectedCards.length === 2 || !selectedCards.length) {
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current)
      }
      setSelectedCards([cordinate])
      return 
    }
    setSelectedCards([...selectedCards, cordinate])
    if (cardMetric[selectedCards[0].x][selectedCards[0].y] === cardMetric[cordinate.x][cordinate.y]) {
      setScore(score + 1)
      removePairTimeoutRef.current = setTimeout(() => {
        let newMetric: number[][] = Array(METRIC_SIZE).fill(0)
        cardMetric.forEach((_, x) => {
          newMetric[x] = [...cardMetric[x]]
        })
        newMetric[selectedCards[0].x][selectedCards[0].y] = 0
        newMetric[cordinate.x][cordinate.y] = 0
        setCardMetric(newMetric)
      }, 800)
      return
    }

    resetTimeoutRef.current = setTimeout(() => setSelectedCards([]), 800)
  }

  const renderCards = () => {
    let rows = []
    let cols = []
    const size = Math.min(window.innerHeight, window.innerWidth) * 0.7 / METRIC_SIZE - 16
    for (let i = 0; i < METRIC_SIZE; i++) {
      cols = []
      for (let j = 0; j < METRIC_SIZE; j++) {
        const id = `${i}-${j}`
        cols.push(  
          <div 
            key={id} 
            onClick={onSelectCard({x: i, y: j})}
            className={`flex card items-center bg-white rounded-lg card mb-4 
            ${cardMetric[i][j] === 0 ? 'opacity-0' : ''}
            ${
              selectedCards.find(obj => obj.x === i && obj.y === j)
              ? 'card-active' 
              : ''}`
              } 
            style={{
              width: size, 
              height: size * 1.3, 
              marginLeft: j === 0 ? 0 : 16}}>
            <canvas ref={el => canvasRefs.current[i][j] = el} width={size} height={size - size * 0.1}/>
          </div>
        )

      }
      rows.push(<div key={i} className="flex flex-row items-center justify-center">{cols}</div>)
    }

    return rows 
  }

  const reset = () => {
    setScore(0)
    setSelectedCards([])
    for (let i = 0; i < METRIC_SIZE; i++) {
      for (let j = 0; j < METRIC_SIZE; j++) {
        if (canvasRefs.current?.[i]?.[j]) {
          const context = canvasRefs.current[i][j]?.getContext('2d')
          context?.reset()
        }
      }}
    const {result} = generateMap(1, 1000000, METRIC_SIZE)
    setCardMetric(result)
  }

  useEffect(() => {
    reset()
  }, [])

  useEffect(() => {
    if (cardMetric && !!canvasRefs.current.length) {
      for (let i = 0; i < METRIC_SIZE; i++) {
        for (let j = 0; j < METRIC_SIZE; j++) {
        const context = canvasRefs.current[i][j]?.getContext('2d')
          if (context) {
            context.reset()
            const size = Math.min(window.innerHeight, window.innerWidth) * 0.7 / METRIC_SIZE - 16
            const img = new Image(size * 1.3, size)
            img.src = AXIE_IMAGE_URL.replace(':id', cardMetric[i][j].toString())
            img.onload = () => {
              context.drawImage(img, 0, 0, size * 1.3, size) 
            }
          }
        }
      }
    }
  }, [cardMetric])

  const isDone = score === (METRIC_SIZE**2 / 2)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <div className="fixed items-center left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          Score: {score}
          {isDone && (
              <button className="bg-green-400 p-4 rounded-lg" onClick={reset}>Reset</button>
          )}
        </div>
      </div>

      <div className="mt-1 flex-col items-center justify-center" style={{maxWidth: '80vw', width: '80vh', height: '80vh'}}>
        {!!cardMetric.length && renderCards()}
      </div> 
    </main>
  )
}
