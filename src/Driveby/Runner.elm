module Driveby.Runner exposing (run)

import Date exposing (..)
import Dict exposing (..)
import Driveby exposing (..)
import Driveby.Model exposing (..)
import Driveby.Runner.Model exposing (..)
import Fifo exposing (..)
import Html exposing (..)
import Maybe.Extra as MaybeExtra
import Task


run : Suite -> (Request -> Cmd Msg) -> ((Response -> Msg) -> Sub Msg) -> Program Flags Model Msg
run suite requestsPort responsesPort =
    Html.programWithFlags
        { init = init
        , view = view
        , update = update requestsPort
        , subscriptions = subscriptions responsesPort
        }



--TODO: move into PhantomJsDialect


goto : String -> String
goto url =
    let
        quotedUrl =
            "\"" ++ url ++ "\""
    in
    """page.open(""" ++ quotedUrl ++ """, function(status) { if (status !== 'success') { respond(page, context, [status + ' for ' + """ ++ quotedUrl ++ """]) } else { respond(page, context, []) } });"""


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( Model flags
        (Fifo.fromList
            [ ICommand (goto "http://www.google.com")
            , ICommand (goto "http://www.bbc.co.uk/news")
            ]
        )
    , go
    )


go : Cmd Msg
go =
    Task.perform Go Date.now


subscriptions : ((Response -> Msg) -> Sub Msg) -> Model -> Sub Msg
subscriptions responsesPort model =
    responsesPort Process


update : (Request -> Cmd Msg) -> Msg -> Model -> ( Model, Cmd Msg )
update requestsPort msg model =
    case msg of
        Go x ->
            let
                ( maybeCommand, queue_ ) =
                    Fifo.remove model.queue

                cmd =
                    case maybeCommand of
                        Just c ->
                            requestsPort (Request c.js)

                        Nothing ->
                            Cmd.none

                --maybe later, sleep for X (a-la debounce and then send Go again)
            in
            ( { model | queue = queue_ }, cmd )

        Process response ->
            let
                successful =
                    List.isEmpty response.failures

                queue_ =
                    if not successful then
                        Fifo.insert (ICommand response.js) model.queue
                    else
                        model.queue

                cmd =
                    go
            in
            ( { model | queue = queue_ }, cmd )



--        _ ->
--            ( model, Cmd.none )


view : Model -> Html Msg
view model =
    div [] []
