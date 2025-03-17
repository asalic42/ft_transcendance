from PyQt5.QtWidgets import QApplication, QWidget, QPushButton, QLabel, QVBoxLayout, QHBoxLayout
from PyQt5.QtGui import QMovie
from PyQt5.QtCore import Qt

class GifButtonExample(QWidget):
    def __init__(self):
        super().__init__()

        self.initUI()

    def initUI(self):
        # Layout principal
        layout = QVBoxLayout()

        # Créer un bouton personnalisé avec un GIF
        self.custom_button = self.createButtonWithGif("Cliquez-moi", "imgs/Spinner.gif")

        # Ajouter le bouton au layout principal
        layout.addWidget(self.custom_button)

        # Appliquer le layout à la fenêtre
        self.setLayout(layout)
        self.setWindowTitle("Bouton avec GIF")
        self.resize(300, 100)

    def createButtonWithGif(self, button_text, gif_path):
        # Créer un QPushButton
        button = QPushButton()

        # Créer un widget pour contenir le texte et le GIF
        widget = QWidget()
        hbox = QHBoxLayout(widget)

        # Ajouter le texte
        text_label = QLabel(button_text)
        text_label.setStyleSheet("font-size: 14px; font-weight: bold;")

        # Ajouter le GIF
        self.gif_label = QLabel()
        self.movie = QMovie(gif_path)  # Charger le GIF
        self.gif_label.setMovie(self.movie)
        self.movie.start()

        # Ajouter les éléments au layout horizontal
        hbox.addWidget(text_label)
        hbox.addWidget(self.gif_label)
        hbox.setAlignment(Qt.AlignCenter)  # Centrer les éléments

        # Définir le layout du bouton
        button.setLayout(hbox)

        return button

if __name__ == "__main__":
    app = QApplication([])
    window = GifButtonExample()
    window.show()
    app.exec_()