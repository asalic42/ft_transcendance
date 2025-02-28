import sys
import os
from PyQt5.QtWidgets import (
    QApplication,
    QMainWindow,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QTextBrowser,
    QLabel,
    QWidget
)
from PyQt5.QtCore import QProcess
from dotenv import load_dotenv
import signal
import re
from threading import Thread
from time import sleep
import subprocess



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

############################################################################

import re

# Fonction de remplacement avec couleur
def replace(match, color, dot=True):
    return (f"\x1b[1;{color}m\n● {match.group(0)}\x1b[0m" if dot else f"\x1b[1;{color}m{match.group(0)}\x1b[0m")

# Fonction de remplacement simple
def replace_simple_sub_instance(cstr, what_to_replace, color, dot=True):
    return re.sub(what_to_replace, lambda match: replace(match, color, dot), cstr)

# Fonction pour vérifier la présence d'un mot dans la chaîne
def check_if_in(cstr, word):
    return bool(re.search(word, cstr))

# Fonction de remplacement pour tous les éléments dans un dictionnaire
def replace_all_sub_instance(cstr, dico_word_color, pattern=None, dot=True):
    if not dico_word_color:  # Si le dictionnaire est vide, on retourne la chaîne inchangée
        return cstr
    
    for word, color in dico_word_color.items():
        if pattern and check_if_in(cstr, word):  # Si pattern est défini, appliquer le remplacement conditionnel
            cstr = replace_simple_sub_instance(cstr, pattern, color, dot)
        else:
            cstr = replace_simple_sub_instance(cstr, word, color, dot)
    
    return cstr


############################################################################


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
                    font-size: 28px;
                }
                QPushButton:hover {
                    background-color: darkviolet;
                }
                """)
            
        def addElmt(labelText, buttonName, buttonFunction):
            
            subLayout = QVBoxLayout()

            label = QLabel(f" ●  {labelText}")
            label.setStyleSheet("font-weight: bold; font-size: 10px;")
            button = QPushButton(f"{buttonName}")
            styleButton(button)
            button.clicked.connect(buttonFunction)

            subLayout.addWidget(label)
            subLayout.addWidget(button)

            return (subLayout)

        # Boutons
        l_launch = addElmt("Appelle la règle [b-all]", "Lancer", self.launch)
        l_static = addElmt("Collecte les statics", "Static", self.static)
        l_relaunch = addElmt("Envoie un [Ctrl+C] et lance [b-all]", "Relancer", self.relaunch)
        l_stop = addElmt("Envoie un [Ctrl+C]", "Stop", self.stop)
        l_docker_stop = addElmt("Envoie un [Ctrl+C] et lance [docker compose stop]", "Docker Stop", self.dockerStop)

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
        layout.addLayout(l_static)
        layout.addLayout(l_relaunch)

        """ layout.addWidget(self.output) """
        
        layout.addLayout(l_stop)
        layout.addLayout(l_docker_stop)

        # Conteneur pour le layout
        container = QWidget()
        container.setStyleSheet("background-color: #e7e7e7;")

        ltmp = QHBoxLayout()

        ltmp.addLayout(layout)
        ltmp.addWidget(self.output)

        container.setLayout(ltmp)
        container.setStyleSheet("border: 1px solid;")
        self.setCentralWidget(container)

        # Processus pour exécuter les commandes
        self.process = QProcess(self)
        self.process.readyReadStandardOutput.connect(self.read_output)
        self.process.readyReadStandardError.connect(self.read_output)

    def launch(self):
        """Lance la commande 'launch'."""
        self.run_command(self.all_cmd["launch"])

    def static(self):
        """Lance collectstatic.sh et affiche la sortie en temps réel."""
        self.static_process = QProcess(self)  # Créer un nouveau QProcess
        self.static_process.readyReadStandardOutput.connect(lambda: self.read_output(self.static_process))
        self.static_process.readyReadStandardError.connect(lambda: self.read_output(self.static_process))
            
        command = ["sh", "../SiteLauncherGui/collectstatic.sh"]
        self.static_process.start(command[0], command[1:])



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
        self.output.append(ansi_to_html("\033[1;34m [SIGNAL] Waiting to stop docker services.\033[0m"))
        self.stop()
        self.run_command("docker compose stop")

        self.process.waitForFinished()
        self.output.append(ansi_to_html("\033[1;32m [SIGNAL] Docker services are down.\033[0m"))

    def run_command(self, command):
        """Exécute une commande système."""
        self.process.start(command)

    def read_output(self, process = None):
        """Lit la sortie du processus et l'affiche dans la zone de texte."""
        # Lire la sortie standard
        if (process == None):
            output = self.process.readAllStandardOutput().data().decode()
            error = self.process.readAllStandardError().data().decode()
        else:
            output = process.readAllStandardOutput().data().decode()
            error = process.readAllStandardError().data().decode()
        # Lire les erreurs
        #if len(error) != 0:
        #    error = "\x1b[1;31m[STDERR]\x1b[0m " + error

        # Appliquer les remplacements de couleurs
        output = replace_all_sub_instance(output, {'web ': '34', 'nginx ': '36'}, r'\[.*?\]', False)
        output = replace_all_sub_instance(output, {'web': '34', 'db': '33', 'nginx': '36'}, r'\w+-\d+(?=\s+\|)', False)

        error = replace_simple_sub_instance(error, 'Error', '31')
        error = replace_all_sub_instance(error, {'Building': '33', 'Built': '32'}, None, False)
        error = replace_all_sub_instance(error, {'web': '34', 'db': '33', 'nginx': '36'}, r'\w+-\d+(?=\s+\|)', False)

        # Calculer la largeur du QTextBrowser
        browser_width = self.output.viewport().width()

        # Calculer le nombre de tirets en fonction de la largeur du QTextBrowser
        separator_line = '└' + ('─' * (browser_width // 9))  # Diviser par 8 pour ajuster la taille des tirets

        # Ajouter les séparateurs à la sortie et aux erreurs
        if output:
            output = "\033[32m┌> \033[0m" + output
            output += f"\033[32m{separator_line}(stdout)\033[0m\n"
            html_output = ansi_to_html(output)
            self.output.append(html_output)

        if error:
            error = "\033[31m┌> \033[0m" + error
            error += f"\033[31m{separator_line}(stderr)\033[0m\n"  # Ajouter une ligne de tirets après l'erreur
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
    launcher.resize(867, 400)
    launcher.show()
    sys.exit(app.exec_())
