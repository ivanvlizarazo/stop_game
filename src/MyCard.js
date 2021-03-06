import React, { useState } from "react";
import { useSubscription, useMutation } from "@apollo/react-hooks";
import gql from "graphql-tag";
import useStopForm from "./lib/CustomHooks";
import ScoreSelector from "./ScoreSelector";

const GET_POST = gql`
  subscription GetStop($game_id: Int!, $player_id: Int!) {
    stop(
      where: { game_id: { _eq: $game_id }, player_id: { _neq: $player_id } }
    ) {
      animal
      apellido
      ciudad
      color
      cosa
      fruta
      nombre
      pais
    }
  }
`;

const INSERT_STOP = gql`
  mutation InsertStop(
    $animal: String!
    $apellido: String!
    $ciudad: String!
    $color: String!
    $cosa: String!
    $fruta: String!
    $nombre: String!
    $pais: String!
    $player_id: Int!
    $game_id: Int!
  ) {
    insert_stop(
      objects: {
        animal: $animal
        apellido: $apellido
        ciudad: $ciudad
        color: $color
        cosa: $cosa
        fruta: $fruta
        nombre: $nombre
        pais: $pais
        player_id: $player_id
        game_id: $game_id
      }
    ) {
      returning {
        id
      }
    }
  }
`;

const INSERT_GAME_PLAYER = gql`
  mutation InsertGamePlayer($game_id: Int!, $player_id: Int!) {
    insert_games_players(
      objects: { game_id: $game_id, player_id: $player_id }
    ) {
      returning {
        id
      }
    }
  }
`;

const GET_GAME_PLAYER = gql`
  subscription GetGamePlayer($game_id: Int!) {
    games_players(where: { game_id: { _eq: $game_id } }) {
      player_id
    }
  }
`;

const DELETE_PLAYER_ON_GAME = gql`
  mutation DeletePlayerOnGame($player_id: Int!) {
    delete_games_players(where: { player_id: { _eq: $player_id } }) {
      returning {
        id
      }
    }
  }
`;

export default function MyCard({
  currentPlayer,
  currentPlayerName,
  game,
  gameLetter,
  numberOfPlayers
}) {
  const [disabled, setDisabled] = useState(true);
  const [disabledInput, setDisabledInput] = useState(true);
  const [loadData, setLoadData] = useState(false);
  const [listening, setListening] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [isTheEnd, setIsTheEnd] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [visibleLetter, setVisibleLetter] = useState(false);
  const [visibleTotal, setVisibleTotal] = useState(false);
  const [showLetter, setShowLetter] = useState(true);

  const [insertGame] = useMutation(INSERT_STOP);
  const [insertGamePlayer] = useMutation(INSERT_GAME_PLAYER);
  const [deleteGameOnPlayer] = useMutation(DELETE_PLAYER_ON_GAME);
  const { loading, data = {} } = useSubscription(GET_POST, {
    variables: { game_id: game, player_id: currentPlayer }
  });
  const {
    getStopId,
    inputs,
    scoreInputs,
    handleInputChange,
    handleInputScoreChange,
    handleSubmit,
    handleSubmitScore
  } = useStopForm(
    {
      nombre: "",
      apellido: "",
      ciudad: "",
      pais: "",
      animal: "",
      fruta: "",
      color: "",
      cosa: "",
      game_id: game,
      player_id: currentPlayer
    },
    {
      nombre: null,
      apellido: null,
      ciudad: null,
      pais: null,
      animal: null,
      fruta: null,
      color: null,
      cosa: null,
      stop_id: null
    },
    () => {}
  );

  const getGamePlayer = useSubscription(GET_GAME_PLAYER, {
    variables: { game_id: game },
    onSubscriptionData: ({ subscriptionData }) =>
      checkNumOfPlayers(subscriptionData)
  });

  function checkNumOfPlayers(playersList) {
    if (playersList.data.games_players.length < numberOfPlayers) {
      if (!disabled && !disabledInput) {
        setDisabled(true);
        setDisabledInput(true);
      }
    } else {
      //cuando los jugadores se completan, todo se habilita para que empiece el juego
      if (playersList.data.games_players.length >= numberOfPlayers) {
        // Cuando se supera la cantidad de jugadores permitidos
        const allowedPlayersArray = playersList.data.games_players
          .slice(0, numberOfPlayers)
          .map(player => player.player_id);
        if (allowedPlayersArray.includes(currentPlayer)) {
          if (!visibleLetter && showLetter) {
            setVisibleLetter(true);
            setShowLetter(false);
            showLetterPopUp();
          }

          if (disabled && disabledInput && !isReady) {
            setDisabled(false);
            setDisabledInput(false);
            setIsReady(true);
          }
        } else {
          if (disabled && disabledInput && !isReady) {
            setDisabled(false);
            setDisabledInput(false);
            setIsReady(true);
          }

          // El jugador no se registró cuando aún habían cupos disponibles,
          //así que se borra de la partida y se dirige a la página de inicio
          deleteGameOnPlayer({ variables: { player_id: currentPlayer } });
          window.location.reload();
          alert(
            "Lo sentimos, hubo un jugador que se registró antes que tú y ocupó el tope de la partida"
          );
        }
      }
    }
  }

  if (isFirstTime) {
    //si es la primera vez que entra a la partida actual,
    //registra el id del jugador con el id de la partida actual
    setIsFirstTime(false);
    insertGamePlayer({
      variables: { game_id: game, player_id: currentPlayer }
    });
  }

  if (!loading) {
    // Si el otro jugador da stop, deshabilita mis campos
    if (data.stop.length > 0 && !disabledInput) {
      setDisabledInput(true);
      setDisabled(true);
      setLoadData(true);
      setIsTheEnd(true);
    }
  }

  if (disabledInput && loadData && listening) {
    //cuando el oponente da stop, envía los datos a la base de datos
    setLoadData(false);
    setListening(false);

    insertGame({
      variables: inputs
    }).then(res => {
      getStopId(res.data.insert_stop.returning[0].id);
    });
  }

  function disableButton() {
    // Deshabilita el botón de stop para que no se oprima varias veces y haga muchos insert
    setDisabled(true);
    setListening(false);
  }

  function onChange(e) {
    handleInputChange(e);
  }

  function showLetterPopUp() {
    var x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function() {
      x.className = x.className.replace("show", "");
    }, 3000);
  }

  function showTotal() {
    setVisibleTotal(true);
  }

  function total(scores) {
    let total = 0;

    for (const key in scores) {
      if (typeof scores[key] === "number" && key !== "stop_id") {
        total += scores[key];
      }
    }
    return `Total: ${total}`;
  }

  return (
    <React.Fragment>
      <form
        onSubmit={e => handleSubmit(e, inputs, disableButton)}
        autoComplete="off"
      >
        <div id="snackbar">{`Letra: ${gameLetter}`}</div>

        <div className="card">
          <div className="header">
            <span>{visibleLetter ? `Letra: ${gameLetter}` : " "}</span>
            <span>{`${currentPlayerName}`}</span>
          </div>

          <div className="table">
            <div>
              <label>Nombre</label>
              <input
                name="nombre"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.nombre}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="nombre"
                />
              ) : null}
            </div>
            <div>
              <label>Apellido</label>
              <input
                name="apellido"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.apellido}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="apellido"
                />
              ) : null}
            </div>
            <div>
              <label>Ciudad</label>
              <input
                name="ciudad"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.ciudad}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="ciudad"
                />
              ) : null}
            </div>
            <div>
              <label>País</label>
              <input
                name="pais"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.pais}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="pais"
                />
              ) : null}
            </div>
            <div>
              <label>Animal</label>
              <input
                name="animal"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.animal}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="animal"
                />
              ) : null}
            </div>
            <div>
              <label>Fruta</label>
              <input
                name="fruta"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.fruta}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="fruta"
                />
              ) : null}
            </div>
            <div>
              <label>Color</label>
              <input
                name="color"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.color}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="color"
                />
              ) : null}
            </div>
            <div>
              <label>Cosa</label>
              <input
                name="cosa"
                type="text"
                onChange={e => onChange(e)}
                value={inputs.cosa}
                disabled={disabledInput}
              />
              {isTheEnd ? (
                <ScoreSelector
                  readOnly={visibleTotal}
                  onChange={handleInputScoreChange}
                  fieldName="cosa"
                />
              ) : null}
            </div>
          </div>
          <div className="hole hole-top"></div>
          {/* <div className="hole hole-middle"></div> */}
          <div className="hole hole-bottom"></div>
          {isTheEnd && !visibleTotal ? (
            <button
              type="button"
              className="purple-button"
              onClick={e => handleSubmitScore(e, scoreInputs, showTotal)}
            >
              Publicar mi resultado
            </button>
          ) : null}
          {isTheEnd && visibleTotal ? <span>{total(scoreInputs)}</span> : null}
        </div>
        <button
          type="submit"
          className={`stop-button ${isTheEnd ? "end" : ""}`}
          disabled={disabled}
        >
          Stop!
        </button>
      </form>
    </React.Fragment>
  );
}
