---
layout: post
title: "A Pattern That Makes Itself"
date: 2026-06-08
description: "A walk through cellular automata, Daniel Dennett's Real Patterns, and Anil Seth's critique of computational functionalism from the perspective of biological naturalism. The essay then puts these concepts under a critical lens, asking whether biology or non-computability really blocks machine consciousness."
---

*This piece grew out of a philosophy course I took last semester. For the final paper, I compared and criticized two arguments against conscious machines: Roger Penrose's Gödelian case that the mind exceeds any formal system, and Anil Seth's biological naturalism, which holds that consciousness requires a living, metabolic body. While I originally tackled both, I have since reworked the Seth side into a self-contained piece, building out the computational scaffolding I initially assumed as background. By first exploring cellular automata and Dennett's Real Patterns, my goal is to unify a set of ideas. With this framework in place, I aim to explain why Seth's objection fails to convince me. Hope it will be a good read.*

--- 

Imagine shrinking until you are small enough to walk across a computer screen, so small that the square beneath your feet is a single pixel. From down here there is no image at all. There is only your pixel, blinking on, then off, then on again, following some rule you cannot see, surrounded by millions of others doing the same. No landscape, no face, no meaning: just lights flickering in the dark. To find the picture, you would have to climb back out, up and away, until the pixels blur together into something whole.

This change of scale points toward one of the deepest puzzles in science (if you accept a physicalist stance, I suppose): how does the physical world, which inherently consists of particles and their movements, give rise to something as strange as a living mind? How do atoms (which know nothing and feel nothing) eventually arrange themselves into creatures that know they exist?

This question assumes some kind of emergence, and I want to approach it from a computational perspective. To do that, we first need to understand the concept of emergence, and what it means to approach it computationally. So let's set the scene.

## Why Emergence Is a Difficult Word

The word emergence is one of the most contested in all of science and philosophy. Skeptics have called it a placeholder for ignorance, a way of saying *something happens here that we don't yet understand* while making it sound profound. Others argue it is not a single concept at all, but a family of loosely related phenomena that resist unified treatment. Emergence, in this sense, can operate like a god of the gaps, a name we reach for whenever the reductionist assumption, that the way to understand something complex is to take it apart, runs out of road.

These criticisms are not trivial. Those who study the concept tend to distinguish a stronger reading, in which higher-level properties are completely irreducible to lower-level ones, from a weaker one, in which higher-level behavior is in principle derivable from the lower-level rules but only through computation too expensive to be tractable. Neither reading has settled the debate. The strong version is philosophically dramatic but widely contested; the weak version, more workable, is sometimes accused of being so permissive it says nothing interesting. A reasonable strand of opinion holds that the word should be abandoned entirely until we have sharper tools for saying what we mean.

One way forward, I think, is to stop arguing about definitions and start looking at concrete cases. That is exactly what John von Neumann did, and it is where I want to start.

## Von Neumann's Question

By the late 1940s, John von Neumann had helped design the atomic bomb, invented the architecture underlying every modern computer, and made foundational contributions to quantum mechanics, game theory, and economics. But beyond all of that, one problem bothered him, not a problem of physics or mathematics, but of biology: *what is the minimum logical requirement for a machine to reproduce itself?*

The question sounds straightforward until you think about it carefully. A machine that builds another machine needs a blueprint. But the blueprint is itself a physical object, which means the copying machine must also copy the blueprint, which means the blueprint must contain instructions for copying the blueprint, and so on, forever. Von Neumann had run into an apparent infinite regress of descriptions. Nature, of course, had solved this effortlessly for three billion years. But how?

Working with the mathematician Stanisław Ulam, von Neumann arrived at a strange solution. He abandoned continuous space entirely and replaced it with something radically abstract: a discrete grid where time moves in steps, and each cell follows a simple, local rule.

He designed a 29-state automaton capable of self-reproduction, which was also the first discrete parallel computational model in history formally described as capable of universal computation. He had not just solved a biological puzzle; in the same stroke he had invented a new model of computation.

It is worth noting that von Neumann never ran his automaton; in the early 1950s the computation was beyond reach, and his design existed purely on paper. It is also worth noting that his description of a machine reading its own tape and copying it predates the discovery of DNA's structure. When Watson and Crick revealed the double helix in 1953, biologists recognized that DNA does something close to what he had theorized: it functions as both the blueprint and the object being copied.

The grid was born from an interesting question. And the assumption built into his solution was that what matters about life is its logical structure, abstractable from any particular physical stuff. This is a deceptively large claim. If what makes something alive is a matter of organization rather than material, then living things might in principle be realized in almost any medium that can carry the right structure, the seed of every later argument that mind, too, need not be made of any one kind of stuff.

## What Is a Cellular Automaton?

In the twenty years after von Neumann, the concept was simplified and democratized. Cellular automata are discrete, abstract computational systems: spatially and temporally discrete, abstract (specifiable in purely mathematical terms), and computational. At bottom, any cellular automaton has four ingredients:

| # | Ingredient | What it means |
|---|------------|---------------|
| 1 | **The Grid** | A discrete lattice (a line, a plane, or higher) where the action unfolds. All cells are qualitatively identical. |
| 2 | **The States** | At each step, every cell occupies one state from a finite set. In the simplest automata: alive or dead, on or off. |
| 3 | **The Neighborhood** | The cells immediately surrounding a given cell, and *only* those. There is no action at a distance; a cell's world is entirely local. |
| 4 | **The Transition Rule** | A deterministic function mapping the current neighborhood to the cell's next state. The same rule for every cell, everywhere, always. |

The most important concept here is local action. A cell knows nothing about the board as a whole. It looks only at its immediate neighbors, consults the rulebook, and updates itself. And the gist is this: even perfect knowledge of individual decision rules does not always let us predict macroscopic structure. We get macro-surprises despite complete micro-knowledge.

### Conway's Game of Life

In 1970, the mathematician John Conway introduced what would become the most famous cellular automaton in history. It runs on an infinite two-dimensional grid, and its transition rule contains exactly four lines:

| Rule | Name | Condition |
|------|------|-----------|
| I | **Underpopulation** | A living cell with fewer than two living neighbors dies. |
| II | **Survival** | A living cell with two or three living neighbors persists. |
| III | **Overpopulation** | A living cell with more than three living neighbors dies. |
| IV | **Reproduction** | A dead cell with exactly three living neighbors springs to life. |

Dennett, in his 1991 paper *Real Patterns*, notes that this single deterministic rule set makes the Life world a toy that perfectly instantiates Laplace's determinism: given the state at one instant, you can in principle predict every future instant by applying the rules. The Life world has no hidden variables. Nothing is backstage. And yet what emerges from this transparency cannot be read off from the rules at all.

From these four rules, still lifes appear, and oscillators, and then spaceships. The most famous is the **Glider**, five cells that, through pure mechanical application of the rules, appear to *move* diagonally across the grid:

```
 Gen 0      Gen 1      Gen 2      Gen 4
· ■ · ·    · · · ·    · · · ·    · · · ·
· · ■ ·    ■ · ■ ·    · · ■ ·    · · · ·
■ ■ ■ ·    · ■ ■ ·    ■ · ■ ·    · · ■ ·
· · · ·    · ■ · ·    · ■ ■ ·    · · · ■
· · · ·    · · · ·    · · · ·    · ■ ■ ■
```

After exactly four generations the Glider returns to its original shape, but has moved one cell diagonally. No code instructs it to move. No rule says "travel south-east." It moves because the rules, applied blindly and locally, happen to produce motion. Dennett uses exactly this figure to set up his argument about what should count as real.

If you'd like to see it for yourself, here is a live grid. Press Run and watch the glider walk diagonally, moved by nothing but the rules. Click a cell to toggle it; click and drag to draw.

{% include game-of-life.html %}

## Wolfram's Classification Scheme

In the 1980s, the physicist Stephen Wolfram spent years cataloguing every possible one-dimensional cellular automaton. In a one-dimensional CA, the grid is a single line; each cell's next state depends on its own state and its two neighbors, giving eight possible configurations and therefore 2⁸ = 256 possible rules. Wolfram encoded each as a number (Rule 30, Rule 110, Rule 90…) and found that all 256 sort into four broad behavioral classes:

| Class | Character | Behavior |
|-------|-----------|----------|
| **I** | Order | Everything collapses to a uniform state regardless of the start. No information survives. (Rules 0, 8) |
| **II** | Repetition | Stable repetition or simple periodic cycles. Structured but inert. (Rules 4, 108) |
| **III** | Chaos | Seemingly random noise. Rule 30 is so unpredictable it has been used to generate random numbers. (Rules 30, 90) |
| **IV** | **Complexity** | The middle ground between order and chaos. Structures form, interact, and propagate. (Rules 54, 110) |

### The edge of chaos

The fourth class is where everything interesting lives. Wolfram conjectured (and Christopher Langton later gave the idea a quantitative handle) that Class IV occupies a critical threshold, the **edge of chaos**, between the frozen regularity of Classes I–II and the entropic noise of Class III. Langton's parameter λ measures the fraction of a rule's outputs mapping to a non-zero state; as λ rises from 0 to 1, behavior shifts from uniformity through periodicity into chaos, and Class IV rules cluster at an intermediate value, where information can both propagate across the grid and persist over time.

The strong version of this idea (that computation *lives* at the edge of chaos) was later challenged: Mitchell, Crutchfield, and Hraber showed that several of the headline results were partly artifacts of how the experiments were run. So treat it as suggestive, not proven. What survives is modest but useful (complex behavior needs a regime where information neither freezes nor dissolves), and that much is more than metaphor: a real relationship between a rule's structure and the behavior it can support.

### An Example: Rule 110

It helps to see one of these rules in full. Rule 110 runs on a single line of cells, each either 1 (filled) or 0 (empty). To update a cell, you look at a *neighborhood* of three: the cell itself together with its immediate left and right neighbors. Three binary cells give eight possible neighborhoods, and the rule simply specifies an output for each:

| Neighborhood (left, center, right) | New state of the center cell |
|:---:|:---:|
| 111 | 0 |
| 110 | 1 |
| 101 | 1 |
| 100 | 0 |
| 011 | 1 |
| 010 | 1 |
| 001 | 1 |
| 000 | 0 |

Read the right-hand column from top to bottom (01101110), and you get 110 in decimal. That is where the name comes from; the other 255 elementary rules are numbered the same way. You apply the rule to every cell at once to produce the next line, then repeat.

What makes Rule 110 remarkable is what happens when you let it run from a random starting line. It does not dissolve into uniform static, and it does not settle into a clean repeating pattern. Instead it throws off intricate, asymmetric structures: localized patterns that travel and collide, the one-dimensional cousins of the Glider. In 2004 the mathematician Matthew Cook proved that this behavior is enough to make Rule 110 *Turing complete*: with the right starting line of 1s and 0s, this single trivial-looking rule can in principle carry out any computation any computer can: run a calculator, a game, an entire program. Universal computation, hiding inside an eight-row lookup table.

## The Glider Problem, and What Counts as Real

Ask a physicist to look at the Game of Life and they will say: there is no such thing as a Glider. There are only cells turning on and off according to rules. The Glider is an illusion, a story we tell ourselves about pixels.

And technically, the physicist is right. There is no line of code that says `move_glider_diagonally()`. If you describe the game entirely at the level of the rules (the only fundamental level) you will never find it. But in *Real Patterns*, Daniel Dennett pushed back with a simple, devastating question: if the Glider isn't real, how do you predict where it will be in 10,000 generations?

| Approach | Method | Cost |
|----------|--------|------|
| **The physical stance** | Calculate the exact state of every cell, one generation at a time, for all 10,000 steps. | Perfectly accurate in principle, and completely intractable. Even in the Life world, where there is no noise and no randomness, the computational cost is unbearable. |
| **The design stance** | Recognize the cluster as a Glider; know it moves one cell diagonally every four generations; multiply. | The answer in seconds. Predicting in your head versus simulating millions of pixels through thousands of generations. |

He grounded this in information theory. Drawing on Gregory Chaitin's definition of randomness, he argued that a data series is random if and only if its description is incompressible: nothing shorter than the verbatim bit-map will do. Conversely, a series has a pattern if there is some more efficient description. The Glider is real by this criterion: 'five cells moving diagonally every four ticks' is more compact than listing every cell it passes through. The compression is not a cognitive convenience; it is a feature of the data.

Dennett calls this level of description the design stance: you treat a system as if it were designed to behave in a certain way, and you predict accordingly. The Glider is a design-stance object. His deeper aim in Real Patterns is to show that the same compressibility argument applies one level higher, at what he calls the intentional stance: treating a system as a rational agent with goals. That is where folk psychology lives, and that is the real target of the argument.

Dennett's deeper motivation for this argument is to offer a new way of thinking about the status of *folk psychology* in cognitive science. Folk psychology is the everyday practice we all use to explain and predict behavior in terms of mental states: beliefs, desires, intentions, fears. You expect a friend to take an umbrella because she *believes* it will rain and *wants* to stay dry. In early cognitive science this ordinary framework became a battleground. The question was whether folk psychology is a kind of proto-scientific theory, one that a mature science of the mind would either vindicate, by finding real beliefs and desires inside the head, or else discard as a primitive misdescription, the way chemistry discarded phlogiston. The stakes were high: if there is nothing belief-shaped in the brain, does that mean beliefs are not real?

| Thinker | Position |
|---------|----------|
| **Fodor**, industrial-strength realism | Beliefs are real only if the macro pattern corresponds to actual physical structure at the micro level. |
| **Dennett**, mild realism | Patterns are real if they license reliable, compressed prediction. A physical substrate need not encode them. |
| **Churchland**, eliminative materialism | Higher-level patterns are placeholders, to be replaced once neuroscience matures. |

Both Fodor and Churchland share one assumption: that for a higher-level pattern to be real, it must correspond to some matching structure in the underlying mechanism. They simply draw opposite conclusions from it. Fodor, the realist, holds that beliefs and desires *are* real because the brain contains genuine internal representations with the right causal structure, a language of thought whose logic mirrors that of folk psychology. Churchland, the eliminativist, accepts the same demand for a structural match but bets it will fail: if neuroscience finds nothing in the brain shaped like a belief, then folk psychology is simply a false theory with no scientific standing, destined to go the way of phlogiston.

Dennett occupies the middle: higher-level patterns can be real without being locally encoded or mirrored by the mechanism that produces them, defended on the hard-nosed grounds of predictive success through compression. The Glider is real because betting on it pays off; folk psychology is, in some sense, real for the same reason. A pattern is real, here, when it is useful to an observer, when someone standing outside the system can use it to compress and predict. It is an account of patterns seen from the outside.

## Life as a Pattern in Patterns

You are made of an almost unimaginable number of atoms. At the lowest level there is no "you": only carbon, hydrogen, and oxygen atoms blindly obeying quantum mechanics and electromagnetism, not unlike the cells in Conway's grid. None of them has the faintest idea that together they constitute a person. Tracking all of them is not merely impractical; it is physically impossible: no computer the universe could build is large enough to store the description. So nature, and the scientists who study it, rely on Real Patterns:

| Level | Pattern | Description |
|-------|---------|-------------|
| 1 | **Atoms** | Obeying quantum mechanics and electromagnetism. Governed entirely by local interaction, like Conway's cells. |
| 2 | **DNA** | A pattern in atoms encoding heredity, close to the structure von Neumann theorized before 1953. |
| 3 | **Cells** | A pattern in DNA and molecules: the basic unit of life. Von Neumann's universal constructor, realized. |
| 4 | **Organs** | A pattern in cells specialized for a function: pumping blood, filtering toxins, processing light. |
| 5 | **The Organism** | A pattern in organs that breathes, hunts, fears, and loves. A Glider at a vast scale, or so the analogy goes. |

A biologist need not calculate the quantum trajectory of every electron in an organism to predict how it will behave. The high-level descriptions we actually use are the Real Patterns that compress an incomprehensible amount of physical information into something usable. At each step, the description is in principle derivable from the level below, but not practically derivable.

So far so good. But there is a quiet assumption riding along, worth naming before we lean on it harder. To call the organism 'a Glider at a larger scale' is to treat it the way Dennett treats the Glider: as a pattern an observer finds it efficient to track. That is unimpeachable as far as prediction goes.

## The Ghost in the Grid

Your brain contains billions of neurons. Each can be caricatured as a cell in a grid following one local rule: if I receive enough signals from my neighbors, I fire; otherwise I stay quiet. (Real neurons are far richer than binary cells: they vary in timing, are modulated chemically, and trade in graded rather than strictly all-or-nothing signals. But the structural point survives the simplification.) Map every spark across all neurons and you would see what a physicist sees in Conway's game: a storm of local events with no obvious meaning at that level. You would not see a memory. You would not see a belief. You would not see a self.

And yet you are reading this sentence, understanding it, evaluating it, perhaps pushing back. Something is happening that is not described in the firing rates of individual neurons. Just as the Glider is a pattern in the pixels, the thought is a pattern in the neurons, or so the computational story goes.

Dennett's argument is, at its core, of a specific kind, and it matters what kind of argument it is. It is not an argument from ignorance. It is an argument from computational intractability: even with complete and perfect knowledge of the lower-level rules, predicting macro-behavior by computing through them is in practice impossible at the scales that matter. The intentional vocabulary (beliefs, desires, intentions) is not a placeholder awaiting reduction. It is a compression scheme that captures real predictive patterns.

Yet (for all its force) everything in Dennett's argument concerns what can be predicted about a mind from the outside. It tells us when treating a system as a believer pays off. It is silent on a different question: what it is to be the system that does the believing. That silence is where the second half of this essay begins.

## Emergence, Computationalized

The CA framework lets us replace a vague philosophical concept with a precise one: an emergent pattern is a pattern whose compressed description offers a genuine computational saving over the physical description. The Glider is derivable from the rules, but only through computation that grows astronomically with time; at 10,000 generations, refusing to use the Glider description is not integrity, it is stubbornness. Patterns below this threshold are just noise or simple periodicity; patterns above it, the Glider, the organism, the belief, are real by a criterion that needs no metaphysical extravagance: they are good to bet on.

But notice the shape of that criterion, because the rest of the essay turns on it. Everything here is an account of patterns licensed by an observer's ability to compress and predict. It is, by design, a view from outside, and it works beautifully for what those systems will do. Yet there is a question it cannot reach on its own terms: what it is to be one of these systems. A Glider does not feel itself gliding. Does a crow feel its hunger? Do you feel your beliefs? The compression criterion is the wrong instrument for that question, not because it gives the wrong answer, but because it is not built to ask it.

## Autopoiesis: The View From Inside

For all its power, Dennett's criterion has a blind spot built into its strength. A pattern is real if *an observer* can use it to compress and predict. That says nothing about what it is to *be* that unit, if being it is like anything at all.

In the early 1970s, two Chilean biologists set out from the opposite end. Humberto Maturana and Francisco Varela asked not "when should an observer count something as alive?" but "what does a living system *do* that makes it a system in the first place?" Their answer was **autopoiesis**, from the Greek for *self-producing*. A living system is a network of processes that continuously produces the very components that produce the network, and in doing so specifies its own boundary. A cell manufactures the membrane that contains the chemistry that manufactures the membrane. There is no blueprint read by an external machine, as in von Neumann's design; the organization and the thing organized are the same loop, sustained from within.

Maturana and Varela were explicitly rejecting the standpoint the first half of this essay relied on. A Real Pattern is something we find useful. An autopoietic unity is something that constitutes *itself*, whether or not anyone is watching. Their 1972 book's original Spanish title was, tellingly, *De máquinas y seres vivos* (*On Machines and Living Beings*), and its burden is that a living being is not merely a machine described from the outside, but a unity that continually brings itself forth, something an external description never fully captures.

And they pressed the point further than biology. Living systems, they claimed, are already *cognitive* systems: living as a process is a process of cognition. A bacterium swimming up a glucose gradient is, in their sense, already knowing its world, discriminating, responding, maintaining itself against perturbation. Cognition is not a trick brains bolt onto life. It is what being alive already *is*. This scandalized a generation of AI researchers who had assumed cognition was computation and could therefore run on anything.

That difference, on this view, is exactly what the Glider lacks. A Glider does not produce its own components. It does not maintain a boundary against a world; it does not resist its own dissolution; nothing is at stake for it. Remove the observer who calls it a Glider and there is nothing but cells obeying the rule, which was Dennett's point, and also his limit. So the autopoietic verdict is that the organism is not, after all, simply a very complex Glider: it is the one thing a Glider supposedly can never be, a pattern that holds *itself* together, and for which holding together *matters*. That claim is the hinge of the entire life-first case. It is also, as we will see, the point where the case overreaches.

It is worth mentioning that autopoiesis is contested as a definition of life. Some purely physical, clearly non-living systems (Bénard convection cells, a candle flame) display a kind of self-maintaining organization without being alive, which suggests the criterion is at least incomplete. Maturana and Varela's later extension of the idea to societies and language strained it further. So read autopoiesis here not as a settled definition but as a *reorientation*: from the pattern as seen to the system as self-made. Even if it does not draw the boundary of life perfectly, it isolates what the compression criterion leaves out entirely.

## The Beast Machine

If autopoiesis is the abstract claim, the neuroscientist Anil Seth has given it a modern, empirical body. In *Being You*, Seth argues that perception is not a transparent window onto the world but a **controlled hallucination**: the brain constantly generates predictions about the causes of its sensory signals, and what we experience is the brain's best guess, continuously reined in by sensory data. Seeing is a hallucination held on a leash, and an ordinary hallucination is simply perception that has slipped the leash.

Seth's deeper move is *why* brains do this. Not, fundamentally, to build accurate pictures, but to keep the body alive. Beneath vision and hearing lies *interoception*: the brain's prediction and regulation of its own internal physiological state, the many variables that must stay within narrow bounds for the organism to persist. The conscious self, on this account, is not a thing that has a body; it is the felt interior of a body regulating itself in the service of staying alive. He calls this the **beast machine**, to insist on our animal, metabolic nature against any picture of the mind as a disembodied computer.

When Seth turns this into an argument against conscious machines, it comes in two steps. The first is an attack on *substrate flexibility*, the assumption, built into computational functionalism, that the functions underlying consciousness can be lifted off their biological hardware and re-run on any medium that preserves the right organization. Seth thinks this assumption fails. Neural function, he argues, is not cleanly decomposable into discrete, Turing-computable operations: it depends on continuous electromagnetic field interactions, fine-grained temporal dynamics, freely diffusing neurotransmitters, and metabolic regulation, real-valued, temporally extended processes that, on his view, are not merely hard to simulate but in an important sense lie *outside* computation, because their functional power is grounded in material dynamics rather than symbol manipulation. Evolution has *generatively entrenched* these functions, coupling them so tightly to specific material features that they resist decomposition into modular, swappable parts. As Seth puts it, brains may be the kind of thing for which it is hard, perhaps impossible, to separate *what they do* from *what they are*.

From this follows his main point: the difference between **simulating** a process and **instantiating** it. A digital model might reproduce the input–output behavior of a conscious brain without thereby being conscious, just as simulating a rainstorm, however faithfully, leaves everything bone dry. Simulating neural dynamics, on this view, no more produces experience than simulating rain produces water. He reinforces this with an appeal to *causal and informational closure*: in evolved, deeply entrenched systems like the brain, the high-level functions stay coupled to the low-level material dynamics, so you cannot cleanly lift the software off the wetware and expect the relevant powers to survive the move.

The second step is the positive account. Seth grounds it in two frameworks: the **Free Energy Principle** (FEP), which characterizes living systems as those that act to minimize free energy (roughly, surprise about their own sensory states) and so resist the entropic slide toward disorder; and **predictive processing** (PP), which models perception, action, and selfhood as hierarchical Bayesian inference aimed at minimizing prediction error. Seth insists these are not disembodied abstractions: they are realized through the concrete physical dynamics of metabolism, homeostasis, and boundary maintenance in an autopoietic system. Consciousness, for him, arises from prediction-driven self-regulation in a metabolically active, self-organizing body, not from computation in the abstract.

This is where the two traditions come to a head over a single question: does the *substrate* matter?

| | Position |
|---|----------|
| **The computationalist hope** | Consciousness is information processing of the right kind. Get the functional organization right and the material is irrelevant. |
| **Seth's wager** | In a computer there is a clean line between software and hardware. In a living system there is no such line: you cannot say where the mind-ware stops and the wet-ware begins. A conscious system may have to be one that cares about its own persistence all the way down into its mechanisms, with no arbitrary cutoff between what computes and what lives. |

Seth does not claim to have proven this. He offers it as a principled reason to doubt that consciousness is substrate-neutral, and it grows directly out of autopoiesis: **the system must be one for which its own continued existence is at stake.**

Notice the lineage. Varela spent his later career developing *enactivism*, the thesis, set out with Evan Thompson and Eleanor Rosch in *The Embodied Mind*, that mind is not computation in the head but the activity of a living body bringing forth a world. Thompson later pushed this into a full life–mind continuity thesis: the very properties that make something alive are continuous with those that make it a mind. Seth's interoceptive, life-first picture is the empirically grounded descendant of this line. Where Dennett asks what patterns an observer should bet on, this tradition asks what it takes to be a system for which anything is at stake at all, and answers: you have to be alive.

## Turning the Lens

The life-first view is a serious objection to the computational emergence story, so it deserves the hardest scrutiny. When you give it that scrutiny, a pattern emerges: several of its load-bearing claims either turn on themselves or rest on a step that is never quite taken. Let me go through them.

### The frameworks cut the other way

Start with the foundation of Seth's positive account: the Free Energy Principle and predictive processing. Here is the awkward fact. Both are *information-theoretic, substrate-neutral formalisms*. FEP describes a system's behavior as variational inference on a generative model; PP describes cognition as hierarchical Bayesian prediction-error minimization. Neither says anything about carbon, neurons, or metabolism in particular. A defender might reply that the formalism is neutral while the territory it describes, a system that actually maintains a thermodynamic boundary, is not; I take up that move below. But notice first that the neutrality is not an accident or a simplification, it is what gives these frameworks their reach. Even their action-oriented form, *active inference*, has already been implemented in artificial agents, and is closely related to planning as inference, a standard machine-learning way of treating decision-making as probabilistic inference over action trajectories.

So Seth faces a dilemma. Either FEP and PP capture what is essential to consciousness (in which case, being substrate-neutral, they can in principle be instantiated in a non-biological system, and substrate-dependence collapses) or they do *not* capture what is essential, in which case Seth owes us an account of the missing ingredient. He cannot have it both ways: he cannot rest his theory of consciousness on formalisms that abstract away from biology and simultaneously insist that biology is indispensable.

The way to put the pressure is as a *burden-shift*. Biology can name a location, but not a mechanism. To block machine consciousness, it is not enough to observe that the only conscious systems we know of happen to be biological. One must identify the specific causal property of the wet substrate that is, first, necessary for instantiating these functional principles and, second, *functionally irreducible*, impossible to realize in any other medium. Seth gestures at metabolism, continuity, and entrenchment, but has not yet isolated such a property, shown it to be both necessary for these functional principles *and* impossible to realize in any other medium. Until that is done, the claim that biology is constitutive rather than merely incidental remains an intuition, not an argument.

### Autopoiesis Is Computable

Now the hinge claim from a moment ago: that a pattern on a grid can never truly hold itself together, that self-production belongs to life alone. This is exactly where the view overreaches, because the claim is false, and the proof is sitting in this essay's own opening.

Recall where we began: von Neumann's self-reproducing automaton, a configuration on a grid that builds a copy of itself by reading and copying its own description. This is the strongest example, because it does not merely model self-production: running it is self-production, the genuine article on a grid, decades before anyone tied the idea to biology. And it was not a fluke of his particular design. Christopher Langton's loops (1984) are minimal self-replicating structures in a cellular automaton, and Bert Chan's Lenia (a continuous generalization of the Game of Life) produces soft-bodied, lifelike creatures that maintain their own boundaries, hold together under perturbation, and repair local damage. Together they show how far the same idea extends, from bare replicators to things that look alive. (Whether the lifelike cases are genuinely autopoietic or only compelling models of it is contested; but on the organizational definition Maturana and Varela actually gave, the burden now runs the other way.)

This is not a historical curiosity but an active research program. Mordvintsev and colleagues' neural cellular automata learn a local update rule under which a pattern grows from a single seed and then regenerates after being cut: self-repair as a learned, computable dynamic rather than a designed-in trick. Recent work on computational life shows that when random, non-self-replicating programs are left to interact in a substrate with no imposed goal, self-replicators tend to arise on their own, and complexity keeps building once they do. Self-production emerges from the dynamics rather than being engineered into them. A parallel line of argument, developed at book length by Blaise Agüera y Arcas, takes the von Neumann thread to its conclusion: that self-reproduction, and so life itself, is at bottom computational. None of this settles what life is. But it makes the life-first assumption, that self-maintenance and self-production are the signatures of something computation can only ever mimic from the outside, look increasingly like a bet against the evidence.

This matters because Maturana and Varela themselves defined autopoiesis as an *organizational* principle (a particular topology of self-producing processes), not as a property of any specific material. Nothing in the definition mentions carbon. If autopoiesis is organizational, and organization is exactly the kind of thing computation can capture, then there is no principled barrier to a computational system being autopoietic. The Glider was simply the wrong example: it is a rigid, fixed pattern that does not regulate anything. But the Glider does not exhaust what grids can do. Self-maintenance, boundary formation, and recursive self-production are all within reach of computable dynamics. The view from inside turns out not to be the exclusive property of meat.

### Complexity is not uncomputability

Seth's strongest-sounding claim is that the biological processes underlying consciousness (metabolism, neurotransmitter diffusion, homeostatic regulation) are not just complicated but *non-computable*.

In its strict, formal sense, non-computability is a precise and demanding property. A function is non-computable only when *no* algorithm can compute it, not merely that no efficient algorithm is known, but that none can exist, on any machine, given any amount of time. The canonical case is Turing's halting problem, and the family of undecidable problems that reduce to it: questions for which one can prove, by diagonal argument, that no general procedure can ever return the answer. To earn the claim that a physical process is non-computable, you have to show that its behavior encodes something like that, a problem demonstrably beyond the reach of any algorithm. Mere intricacy does not do this. Neither does continuity, nor sensitivity to initial conditions, nor the sheer number of interacting parts. A system can be staggeringly complex, even chaotic, and remain perfectly computable. Seth never supplies the reduction. What he supplies is the *intuition* that these processes are too rich, too continuous, too embodied to be captured by an algorithm, and an intuition, however well-motivated, is not a proof.

The danger of resting on that intuition is best seen in the history of artificial intelligence, which is in part a graveyard of confident predictions that some task lay beyond mechanism. Vision and fluent language once looked obviously non-algorithmic, too high-dimensional, too context-soaked, too unlike symbol-shuffling to yield to a machine. Symbolic AI tried to capture them with hand-written rules and failed badly enough that one might reasonably have concluded the tasks were simply not computable. Then convolutional networks did vision and transformers did language, with comparatively simple mechanisms, once the architecture was right. The lesson is not that everything is easy; it is that *apparent* intractability usually reflects the limits of our current models, not a formal limit on computation itself. What looks impossible from inside one paradigm routinely falls to another.

There is a further, subtler slip worth naming. Continuous and real-valued do not imply non-computable. Continuous dynamics are approximated to arbitrary precision all the time (neural networks that learn differential equations do exactly this), and the organizational facts that matter for self-maintenance and regulation survive the discretization. Analog computation is still computation; approximating a real-valued process to whatever tolerance the functional story requires is still capturing it. So the move Seth needs (from *biological and continuous* to *beyond computation*) is unsupported twice over: once in sliding from complexity to uncomputability, and again in sliding from the analog to the non-algorithmic.

Put plainly, this is a conflation of *practical intractability* (we cannot yet simulate it well) with *formal uncomputability* (no algorithm could). A great deal of the life-first argument leans on that single equivocation. Once you separate the two, the claim that the biology relevant to consciousness lies *beyond* computation loses almost all of its support.

### The rainstorm begs the question

Which leaves the most quotable objection: simulating a rainstorm doesn't make anything wet, so simulating a brain doesn't make anything conscious. It feels decisive, but I believe it is question-begging.

The reason the rain analogy works is that wetness is, uncontroversially, a *substrate* property: it is literally about water. So of course simulating it does not instantiate it. But that is only a good analogy for consciousness *if you have already assumed* that consciousness is a substrate property rather than an organizational one, which is precisely the point in dispute. Swap in a different analogy and the intuition reverses: a simulation of *addition* is not a fake addition; running the algorithm *is* adding. A simulated chess game is a real chess game. For these, the simulation instantiates the very thing it models, because the thing is defined by organization, not by stuff. Whether consciousness is rain-like or arithmetic-like is the entire question, so the simulation argument cannot be used to answer it. It smuggles in the conclusion it is supposed to earn.

(One smaller point, in passing: Seth's own framework arguably already commits him to a kind of multiple realizability. If FEP and PP describe a continuum of conscious or proto-conscious systems from bacteria to humans, he has accepted that the same principles are realized across radically different physical implementations. There is no non-arbitrary place to draw the line that lets in the bacterium but rules out the machine.)

## Can the Grid Be Conscious?

It is worth being candid about how we got here, because the route was not a straight line. The first half of this essay leaned on Dennett: a pattern is real if an observer can use it to compress and predict. Cellular automata were the ground for this: they showed that organizational properties like self-reproduction, boundary maintenance, and self-regulation are not features that require biological encoding, but can be realized in computation. The life-first challenge then showed that Dennett's criterion was not quite enough: a Glider is real to a viewer, but an organism is real to itself, and that difference is not nothing. The right response was not to retreat to biology but to upgrade the criterion: from real to an observer to intrinsically self-maintaining, and then to notice that self-maintenance is itself an organizational property, demonstrably within computation's reach, as the automata already showed. That is why Seth's argument does not hold: he is right about what matters, that the deepest patterns are the ones that hold themselves together, but the CA framework shows that such patterns do not require the biological substrate he insists on. The defeat comes from his own premises, turned against his conclusion. We have, in a sense, climbed back out from the single pixel to the whole picture, and found the picture was never made of anything but organization.

But there is one thing all of this leaves completely untouched. Suppose we build a system that instantiates the whole functional organization: autopoiesis, interoceptive prediction, a self that regulates its own viability. We will still face the question: *is there something it is like to be it?* Why does any of that organization come with an inner light rather than running in the dark? This is David Chalmers's hard problem, and nothing in the argument above dissolves it.

The hard problem is not a special liability of the computational account. It is a problem for every physical account of consciousness, biological ones included. Seth's brain-based, metabolic story faces it exactly as squarely as a silicon one: explaining all the self-regulating dynamics in the world still does not explain why they are felt, whether those dynamics run on neurons or on transistors. The hard problem taxes the biological naturalist and the computationalist at precisely the same rate, which means it cannot be recruited as a reason to think machines in particular cannot be conscious. It is everyone's mystery, not computation's alone.

That is the shape of the conclusion, and it says almost nothing about consciousness, like almost every essay on consciousness. But at least we have said something. The case that consciousness requires living matter, or that it exceeds computation, does not survive scrutiny. What survives is the hard problem, and it points at no substrate in particular. On this terrain, machine consciousness is not a confusion to be dismissed but a defensible possibility, blocked by no argument we have actually been given.

## Final Words

So, who is right: computationalists, biological naturalists, or someone else? To be honest, I don't really care. I accept that consciousness really is a mystery once you adopt a physicalist stance ontologically, but I don't think the problem will be settled by arguments alone, and yet here we are, making them. I also don't believe consciousness is *the* ultimate question. I believe there are many questions that matter more than the consciousness question, which too often turns into a kind of academic playground, where ideas are thrown around for the sake of throwing them. But I believe a science of consciousness is possible, if we ask the right questions.

I want to end with a thought from Bas van Fraassen's "Transcendence of the Ego (The Non-Existent Knight)," whose conclusion I share. Van Fraassen invites us to consider Agilulf, the non-existent knight of Calvino's novel, an empty suit of armor that nonetheless rides, speaks, and lifts a sword. If such a being existed, he argues, science would face no special crisis. It would simply do what it always does: observe the phenomena, build a first rough model with almost no predictive power, replace it with a better one, and pair each model with explanatory stories that can be tested. There is no argument that science could fail at this, because wherever there are observable phenomena, a scientific account can in principle depict them, inventing unobservable posits where the depiction needs them.

The emergence of consciousness, he says, is no different. The transition from a world without organisms to one with them, and from no consciousness to consciousness, is a change like any other; the question "how does consciousness emerge?" already has an answer at any given moment: whatever model our current science provides for that stage, disappointingly thin today but improving all the time. He likens the perplexity to Hume on miracles: to demand how there could be observed exceptions to a fully adequate science is to ask something self-contradictory, since science simply expands to accommodate whatever actually happens. Philosophers who remain perplexed by how consciousness could possibly have emerged at all in a merely physical world must, he concludes, mean something other than the scientific question, and unless they can keep the two cleanly apart, their problem is a pseudo-problem.

His parting line is the one I want to leave you with. There is a mystery of consciousness, he grants, but it is not among the mysteries that the sciences confront, the ones they so habitually and fortunately address and solve.

---

### Further reading

- Daniel C. Dennett, Real Patterns
- Eric W. Weisstein, Elementary Cellular Automaton
- Francesco Berto and Jacopo Tagliabue, Cellular Automata
- Matthew Cook, Universality in Elementary Cellular Automata
- John von Neumann, Theory of Self-Reproducing Automata
- Stephen Wolfram, A New Kind of Science
- Melanie Mitchell, James P. Crutchfield, and Peter T. Hraber, Dynamics, Computation, and the "Edge of Chaos": A Re-Examination
- Andy Clark, Mindware: An Introduction to the Philosophy of Cognitive Science
- Francisco J. Varela, Evan Thompson, and Eleanor Rosch, The Embodied Mind
- Humberto R. Maturana and Francisco J. Varela, Autopoiesis and Cognition: The Realization of the Living
- Evan Thompson, Mind in Life: Biology, Phenomenology, and the Sciences of Mind
- Anil Seth, Being You: A New Science of Consciousness
- Anil K. Seth, Conscious Artificial Intelligence and Biological Naturalism
- Karl Friston, The Free-Energy Principle: A Unified Brain Theory?
- Christopher G. Langton, Self-Reproduction in Cellular Automata
- Bert Wang-Chak Chan, Lenia: Biology of Artificial Life
- Ricky T. Q. Chen et al., Neural Ordinary Differential Equations
- Alexander Mordvintsev, Ettore Randazzo, Eyvind Niklasson, and Michael Levin, Growing Neural Cellular Automata
- Blaise Agüera y Arcas et al., Computational Life: How Well-formed, Self-replicating Programs Emerge from Simple Interaction
- Blaise Agüera y Arcas, What Is Life? Evolution as Computation
- David J. Chalmers, Facing Up to the Problem of Consciousness
- Bas C. van Fraassen, Transcendence of the Ego (The Non-Existent Knight)
