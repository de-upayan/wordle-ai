import { Box, Container, Heading, Text } from '@chakra-ui/react'

function App() {
  return (
    <Container maxW="container.md" py={8}>
      <Box textAlign="center" mb={8}>
        <Heading as="h1" size="2xl" mb={2}>
          Wordle AI Solver
        </Heading>
        <Text fontSize="lg" color="gray.600">
          Get AI-powered suggestions for your Wordle game
        </Text>
      </Box>
      <Box bg="gray.50" p={8} borderRadius="lg" textAlign="center">
        <Text color="gray.500">
          Frontend is ready. Backend integration coming soon.
        </Text>
      </Box>
    </Container>
  )
}

export default App
