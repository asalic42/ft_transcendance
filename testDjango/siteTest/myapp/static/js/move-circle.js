function createRandomShape() {
    // Creer un element qu'on ajoute a la liste class html (pour les styliser en CSS)
    const shape = document.createElement('div');
    shape.classList.add('shape');

    // Choisi une taille aleatoire entre 50px et 250px
    const size = Math.floor(Math.random() * 200) + 50;
    shape.style.width = `${size}px`;
    shape.style.height = `${size}px`;

    // Position aleatoire sur la page
    shape.style.top = `${Math.random() * 100}vh`;
    shape.style.left = `${Math.random() * 100}vw`;

    // Definir une vitesse d'animation aleatoire
    shape.style.animationDuration = `${Math.floor(Math.random() * 5) + 3}s`;

    // Couleur aleatoire
    const colors = ['#048399', '#005067', '#B96B85', '#5f73b3', '#a32048'];
    const choosen_color = colors[Math.floor(Math.random() * colors.length)];
    shape.style.background = `radial-gradient(circle, ${choosen_color}, white)`;

    // Ajouter la classe changee au body html
    document.body.appendChild(shape);

}   

for (let i=0; i < 10; i++) {
    createRandomShape(); }