import sys
import os
from PyQt5.QtWidgets import (
    QApplication,
    QMainWindow,
    QVBoxLayout,
    QPushButton,
    QTextBrowser,
    QLabel,
    QWidget
)
from PyQt5.QtCore import QProcess
from dotenv import load_dotenv
import signal

def ansi_to_html(ansi_text):
    """Convertit les codes ANSI en HTML en utilisant un mappage personnalisé."""
    color_map = {
        '\x1b[0m': '</span>',  # Reset
        '\x1b[1;31m': '<span style="color: red; font-weight: bold;">',  # Red
        '\x1b[0;31m': '<span style="color: red;">',  # Dark Red
        '\x1b[31m': '<span style="color: red;">',  # Red
        '\x1b[1;32m': '<span style="color: green; font-weight: bold;">',  # Green
        '\x1b[0;32m': '<span style="color: green;">',  # Dark Green
        '\x1b[32m': '<span style="color: green;">',  # Green
        '\x1b[1;33m': '<span style="color: yellow; font-weight: bold;">',  # Yellow
        '\x1b[0;33m': '<span style="color: yellow;">',  # Dark Yellow
        '\x1b[33m': '<span style="color: yellow;">',  # Yellow
        '\x1b[1;34m': '<span style="color: blue; font-weight: bold;">',  # Blue
        '\x1b[0;34m': '<span style="color: blue;">',  # Dark Blue
        '\x1b[34m': '<span style="color: blue;">',  # Blue
        '\x1b[1;35m': '<span style="color: magenta; font-weight: bold;">',  # Magenta
        '\x1b[0;35m': '<span style="color: magenta;">',  # Dark Magenta
        '\x1b[35m': '<span style="color: magenta;">',  # Magenta
        '\x1b[1;36m': '<span style="color: cyan; font-weight: bold;">',  # Cyan
        '\x1b[0;36m': '<span style="color: cyan;">',  # Dark Cyan
        '\x1b[36m': '<span style="color: cyan;">',  # Cyan
        '\x1b[1;37m': '<span style="color: white; font-weight: bold;">',  # White
        '\x1b[0;37m': '<span style="color: white;">',  # Dark White
        '\x1b[37m': '<span style="color: white;">',  # White
        '\x1b[1m': '<b>',  # Bold
        '\x1b[22m': '</b>',  # End Bold
    }

    # Remplacer les codes ANSI par les balises HTML correspondantes
    for ansi_code, html_tag in color_map.items():
        ansi_text = ansi_text.replace(ansi_code, html_tag)

    # Ajouter un wrapper <span> par défaut pour le texte sans couleur
    ansi_text = f"<span>{ansi_text}</span>"

    # Remplacer les retours à la ligne par <br> pour l'affichage HTML
    ansi_text = ansi_text.replace('\n', '<br>')

    return ansi_text

class SiteLauncher(QMainWindow):

    def __init__(self):
        super().__init__()

        load_dotenv()
        script_root = os.getenv("SCRIPT_ROOT")
        os.chdir(script_root)

        self.all_cmd = {"launch": "./log.sh b-all"}
        self.initUI()

    def initUI(self):
        layout = QVBoxLayout()

        def styleButton(button):

            button.setStyleSheet("""
                QPushButton {
                    background-color: #a71fb0;
                    padding: 2px;
                    font-size: 14px;
                }
                QPushButton:hover {
                    background-color: darkviolet;
                }
                """)
            
        def addElmt(labelText, buttonName, buttonFunction):
            
            subLayout = QVBoxLayout()

            label = QLabel(f"┌ {labelText}")
            label.setStyleSheet("font-weight: bold;")
            button = QPushButton(f"{buttonName}")
            styleButton(button)
            button.clicked.connect(buttonFunction)

            subLayout.addWidget(label)
            subLayout.addWidget(button)

            return (subLayout)

        # Boutons
        l_launch = addElmt("Emulate b-all rule.", "Launch", self.launch)
        l_relaunch = addElmt("Emulate Ctrl+C && b-all rule.", "Relaunch", self.relaunch)
        l_stop = addElmt("Emulate Ctrl+C.", "Stop", self.stop)
        l_docker_stop = addElmt("Emulate Ctrl+C && docker-compose stop.", "Docker Stop", self.dockerStop)

        # Zone de texte pour les logs
        self.output = QTextBrowser()  # Utilisation de QTextBrowser
        self.output.setStyleSheet("""
            background-color: black;
            color: white;
            font-family: Monospace;
            font-size: 12px;
        """)
        self.output.setReadOnly(True)
        self.output.setOpenExternalLinks(False)  # Désactiver l'ouverture des liens externes

        # Ajout des widgets au layout
        layout.addLayout(l_launch)
        layout.addLayout(l_relaunch)

        layout.addWidget(self.output)
        
        layout.addLayout(l_stop)
        layout.addLayout(l_docker_stop)

        # Conteneur pour le layout
        container = QWidget()
        container.setStyleSheet("background-color: #e7e7e7;")
        container.setLayout(layout)
        self.setCentralWidget(container)

        # Processus pour exécuter les commandes
        self.process = QProcess(self)
        self.process.readyReadStandardOutput.connect(self.read_output)
        self.process.readyReadStandardError.connect(self.read_output)

    def launch(self):
        """Lance la commande 'launch'."""
        self.run_command(self.all_cmd["launch"])

    def relaunch(self):
        """Redémarre la commande en envoyant un SIGINT (Ctrl+C)."""
        self.stop()
        self.run_command(self.all_cmd["launch"])

    def stop(self):
        """Envoie un signal pour arrêter le script log.sh sans stopper PyQt."""
        if self.process.state() == QProcess.Running:
            # Envoyer SIGTERM pour arrêter log.sh sans tuer l'application PyQt
            pid = self.process.processId()
            if pid:
                os.kill(pid, signal.SIGTERM)  # SIGTERM pour stopper proprement le processus
            self.process.waitForFinished()
            self.output.append(ansi_to_html("\033[1;31m [SIGNAL] ./log.sh as been stop.\033[0m"))

    def dockerStop(self):
        self.stop()
        self.output.append(ansi_to_html("\033[1;34m [SIGNAL] Waiting to stop docker services.\033[0m"))
        self.run_command("sudo docker-compose stop")

        self.process.waitForFinished()
        self.output.append(ansi_to_html("\033[1;32m [SIGNAL] Docker services are down.\033[0m"))

    def run_command(self, command):
        """Exécute une commande système."""
        self.process.start(command)

    def read_output(self):
        """Lit la sortie du processus et l'affiche dans la zone de texte."""
        # Lire la sortie standard
        output = self.process.readAllStandardOutput().data().decode()
        # Lire les erreurs
        error = self.process.readAllStandardError().data().decode()

        # Convertir les codes ANSI en HTML
        if output:
            html_output = ansi_to_html(output)
            self.output.append(html_output)
        if error:
            html_error = ansi_to_html(error)
            self.output.append(html_error)

    def closeEvent(self, event):
        """Gère l'événement de fermeture de la fenêtre."""
        self.stop()  # Arrêter le script log.sh proprement
        event.accept()  # Fermer la fenêtre
        print("Fermeture fenêtre. Arrêt du script.")

if __name__ == "__main__":
    app = QApplication(sys.argv) if not QApplication.instance() else QApplication.instance()
    launcher = SiteLauncher()
    launcher.show()
    sys.exit(app.exec_())
