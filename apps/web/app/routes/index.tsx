import { Container } from '~/components/container'
import NavBar from '~/components/navbar'

export default function Index() {
  return (
    <>
      <Container>
        <header className="mt-6">
          <NavBar />
        </header>
        <main className="mt-10">
          <section>
            <h1 className="text-2xl font-bold">Fullstack Web Developer</h1>
            <p className="mt-4">
              I build web applications with great UX using progressive
              enhancement philosophy—this website works well without JavaScript.
            </p>
          </section>
        </main>
      </Container>
    </>
  )
}
